import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import * as pdf from 'html-pdf';
import { ConfigService } from '@nestjs/config';
import { StorageConfig } from 'src/common/configs/config.interface';
import { PdfGeneratorDto } from './dto/pdfGenerator.dto';
import { UserBriefingOrderService } from 'src/common/prisma-related/user-related/UserBriefingOrder/user-briefing-order.service';
import { PdfGeneratorYoutubeVideo } from './types/videoSummaries.type';
import { BrieferPdfReportService } from 'src/common/prisma-related/BrieferPdfReport/briefer-pdf-report.service';
import { PdfGeneratorException } from './exceptions/pdf-generator.exceptions';

@Processor('pdf-generator')
export class PdfGeneratorProcessor {
  private storageBucket: string;
  private storagePdfPath: string;

  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
    private userBriefingOrderService: UserBriefingOrderService,
    private brieferPdfReportService: BrieferPdfReportService,

    @InjectQueue('email-sender') private emailSenderQueue: Queue,
  ) {
    this.storageBucket =
      this.configService.get<StorageConfig>('storage').bucket;
    this.storagePdfPath =
      this.configService.get<StorageConfig>('storage').pdfPath;
  }

  private readonly logger = new Logger(PdfGeneratorProcessor.name);

  private handleError(error: any): void {
    const pdfGeneratorException = new PdfGeneratorException(error.message);
    this.logger.error(pdfGeneratorException);
    throw error;
  }

  private createHtmlFromData(data: PdfGeneratorYoutubeVideo[]): string {
    try {
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
              <p>Author ${item.videoAuthor}</p>
              <p>URL: <a href="https://www.youtube.com/watch?v=${
                item.youtubeId
              }">${`https://www.youtube.com/watch?v=${item.youtubeId}`}</a></p>
            </div>
        `;
      });

      html += `</body></html>`;
      return html;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createPdf(data: PdfGeneratorYoutubeVideo[]): Promise<Buffer> {
    const html = this.createHtmlFromData(data);
    const options: pdf.CreateOptions = { format: 'A4' };

    try {
      const buffer = await this.createBufferFromHtml(html, options);
      return buffer;
    } catch (error) {
      this.handleError(error);
    }
  }

  private createBufferFromHtml(
    html: string,
    options: pdf.CreateOptions,
  ): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        pdf.create(html, options).toBuffer((err, buffer) => {
          if (err) {
            reject(err);
          } else {
            resolve(buffer);
          }
        });
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async uploadPdf(fileId: string, pdf: Buffer): Promise<void> {
    try {
      await this.supabaseService.uploadFile({
        bucket: this.storageBucket,
        path: `${this.storagePdfPath}/${fileId}.pdf`,
        file: pdf,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async queueEmailSend(userId: string, brieferPdfReportId: string) {
    try {
      const sendEmail = await this.emailSenderQueue.add('sendEmail', {
        userId,
        brieferPdfReportId,
      });
      this.logger.debug({ ADDED_JOB_TO_OTHER_QUEUE: sendEmail });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Process('generatePdf')
  async handlePdfGeneration(job: Job<PdfGeneratorDto>) {
    try {
      this.logger.debug('PDF_GENERATOR_WORKER: Starting generating pdf...');
      this.logger.debug({ PDF_GENERATOR_WORKER: { data: job.data } });

      const { userId, briefingOrderId } = job.data;

      const userBriefingOrder =
        await this.userBriefingOrderService.getUserBriefingOrder(
          {
            id: briefingOrderId,
          },
          {
            YoutubeVideo: {
              select: {
                id: true,
                youtubeId: true,
                videoAuthor: true,
                title: true,
                YoutubeVideoSummary: {
                  select: {
                    summary: true,
                  },
                },
              },
            },
          },
        );

      const videoSummaries = userBriefingOrder.YoutubeVideo.map(
        (video) => video,
      );
      const youtubeVideoIds = userBriefingOrder.YoutubeVideo.map((video) => ({
        id: video.id,
      }));
      const pdfBuffer = await this.createPdf(
        videoSummaries as PdfGeneratorYoutubeVideo[],
      );
      await this.uploadPdf(`${userId}-${briefingOrderId}`, pdfBuffer);
      const pdfUrl = `${this.storageBucket}/${this.storagePdfPath}/${userId}-${briefingOrderId}.pdf`;

      const brieferPdfReport =
        await this.brieferPdfReportService.createBrieferPdfReport({
          pdfUrl,
          fileName: `${userId}-${briefingOrderId}.pdf`,
          UserBriefingOrder: {
            connect: {
              id: briefingOrderId,
            },
          },
          YoutubeVideo: {
            connect: youtubeVideoIds,
          },
        });

      await this.queueEmailSend(userId, brieferPdfReport.id);
      this.logger.debug('PDF_GENERATOR_WORKER: Pdf generated');
    } catch (error) {
      this.handleError(error);
    }
  }
}
