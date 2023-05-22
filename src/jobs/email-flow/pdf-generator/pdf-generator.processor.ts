import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import * as pdf from 'html-pdf';
import { ConfigService } from '@nestjs/config';
import { StorageConfig } from 'src/common/configs/config.interface';
import { YoutubeVideoSummary } from '@prisma/client';
import { PdfGeneratorDto } from './dto/pdfGenerator.dto';

@Processor('pdf-generator')
export class PdfGeneratorProcessor {
  private storageBucket: string;
  private storagePdfPath: string;

  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
    private configService: ConfigService,

    @InjectQueue('email-sender') private emailSenderQueue: Queue,
  ) {
    this.storageBucket =
      this.configService.get<StorageConfig>('storage').bucket;
    this.storagePdfPath =
      this.configService.get<StorageConfig>('storage').pdfPath;
  }

  private readonly logger = new Logger(PdfGeneratorProcessor.name);

  async getSummaryFromPrisma(fileId: string) {
    try {
      const summary = await this.prismaService.youtubeVideoSummary.findUnique({
        where: { youtubeId: fileId },
      });
      return summary;
    } catch (error) {
      this.logger.error(
        `PDF_GENERATOR_WORKER: Failed to get summary from Prisma: fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  private createHtmlFromData(
    data: {
      id: string;
      youtubeId: string;
      title: string;
      YoutubeVideoSummary: YoutubeVideoSummary;
    }[],
  ): string {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
            .header { padding: 20px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 0.1em; }
            .content { padding: 2rem; text-align: justify; }
            .summary { font-size: 16px; }
            .page-break { page-break-after: always; }
        </style>
    </head>
    <body>
        <div class="header">BRIEFER</div>
        <div class="content">
            <h2>Table of Contents:</h2>
            <ol>
    `;

    data.forEach((item) => {
      html += `<li>${item.title}</li>`;
    });

    html += `</ol>`;

    data.forEach((item) => {
      html += `
          <div class="page-break"></div>
          <div class="header">${item.title}</div>
          <div class="content">
            <h3>Summary:</h3>
            <p class="summary">${item.YoutubeVideoSummary.summary}</p>
            <p>URL: <a href="https://www.youtube.com/watch?v=${
              item.youtubeId
            }">${`https://www.youtube.com/watch?v=${item.youtubeId}`}</a></p>
          </div>
      `;
    });

    // Close HTML
    html += `</body></html>`;
    return html;
  }

  async createPdf(
    data: {
      id: string;
      title: string;
      youtubeId: string;
      YoutubeVideoSummary: YoutubeVideoSummary;
    }[],
  ): Promise<Buffer> {
    const html = this.createHtmlFromData(data);
    const options: pdf.CreateOptions = { format: 'A4' };

    try {
      const buffer = await this.createBufferFromHtml(html, options);
      return buffer;
    } catch (error) {
      this.logger.error(
        `PDF_GENERATOR_WORKER: Failed to create PDF: error: ${error.message}`,
      );
      throw error;
    }
  }

  private createBufferFromHtml(
    html: string,
    options: pdf.CreateOptions,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  }

  async uploadPdf(fileId: string, pdf: Buffer): Promise<void> {
    try {
      await this.supabaseService.uploadFile({
        bucket: this.storageBucket,
        path: `${this.storagePdfPath}/${fileId}.pdf`,
        file: pdf,
      });
    } catch (error) {
      this.logger.error(
        `PDF_GENERATOR_WORKER: Failed to upload pdf to Supabase: fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async createBriefingPdfReportPrisma(
    pdfUrl: string,
    youtubeVideoIds: {
      id: string;
    }[],
    briefingOrderId: string,
    fileName: string,
  ) {
    try {
      const brieferPdfReport = await this.prismaService.brieferPdfReport.create(
        {
          data: {
            pdfUrl,
            userBriefingOrderId: briefingOrderId,
            YoutubeVideo: {
              connect: youtubeVideoIds,
            },
            fileName,
          },
        },
      );
      return brieferPdfReport;
    } catch (error) {
      this.logger.error(
        `PDF_GENERATOR_WORKER: Failed to upload to Prisma: pdfUrl: ${pdfUrl}, videoIds: ${youtubeVideoIds
          .map((video) => video.id)
          .join(', ')}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async getBriefingOrder(briefingOrderId: string) {
    try {
      const briefingOrder = this.prismaService.userBriefingOrder.findUnique({
        where: {
          id: briefingOrderId,
        },
        select: {
          YoutubeVideo: {
            select: {
              id: true,
              youtubeId: true,
              title: true,
              YoutubeVideoSummary: true,
            },
          },
        },
      });
      return briefingOrder;
    } catch (error) {
      throw { PRISMA_ERROR: { briefingOrderId, error } };
    }
  }

  async queueEmailSend(userId: string, brieferPdfReportId: string) {
    const sendEmail = await this.emailSenderQueue.add('sendEmail', {
      userId,
      brieferPdfReportId,
    });
    this.logger.debug({ ADDED_JOB_TO_OTHER_QUEUE: sendEmail });
  }

  @Process('generatePdf')
  async handlePdfGeneration(job: Job<PdfGeneratorDto>) {
    this.logger.debug('Starting generating pdf...');
    this.logger.debug(job.data);
    const { userId, briefingOrderId } = job.data;
    const briefingOrder = await this.getBriefingOrder(briefingOrderId);

    const videoSummaries = briefingOrder.YoutubeVideo.map((video) => video);
    const youtubeVideoIds = briefingOrder.YoutubeVideo.map((video) => ({
      id: video.id,
    }));
    const pdfBuffer = await this.createPdf(videoSummaries);
    await this.uploadPdf(`${userId}-${briefingOrderId}`, pdfBuffer);
    const pdfUrl = `${this.storageBucket}/${this.storagePdfPath}/${userId}-${briefingOrderId}.pdf`;
    const brieferPdfReport = await this.createBriefingPdfReportPrisma(
      pdfUrl,
      youtubeVideoIds,
      briefingOrderId,
      `${userId}-${briefingOrderId}.pdf`,
    );
    await this.queueEmailSend(userId, brieferPdfReport.id);
    this.logger.debug('Pdf generated');
  }
}
