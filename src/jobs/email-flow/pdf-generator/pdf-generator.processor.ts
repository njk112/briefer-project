import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import * as pdf from 'html-pdf';
import { ConfigService } from '@nestjs/config';
import { StorageConfig } from 'src/common/configs/config.interface';
import { YoutubeVideoSummary } from '@prisma/client';
import { GeneratePdfDto } from 'src/youtube/dto/queue-jobs.dto';

@Processor('pdf-generator')
export class PdfGeneratorProcessor {
  private storageBucket: string;
  private storagePdfPath: string;

  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
    private configService: ConfigService,
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

  private createHtmlFromData(data: YoutubeVideoSummary[]): string {
    // Start building HTML string
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

    // Add links to the table of contents
    data.forEach((item) => {
      html += `<li>${item.youtubeId}</li>`;
    });

    // Close list and add footer with date to the title page
    html += `</ol>`;

    // Add each video summary as a new page
    data.forEach((item) => {
      html += `
          <div class="page-break"></div>
          <div class="header">${item.youtubeId}</div>
          <div class="content">
            <h3>Summary:</h3>
            <p class="summary">${item.summary}</p>
            <p>URL: <a href="${item.id}">${item.id}</a></p>
          </div>
      `;
    });

    // Close HTML
    html += `</body></html>`;
    return html;
  }

  async createPdf(data: YoutubeVideoSummary[]): Promise<Buffer> {
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

  async uploadToPrisma(pdfUrl: string, fileIds: string[]): Promise<void> {
    try {
      await this.prismaService.brieferPdfReports.create({
        data: {
          pdfUrl,
          videoSummary: {
            connect: fileIds.map((fileId) => ({ youtubeId: fileId })),
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `PDF_GENERATOR_WORKER: Failed to upload to Prisma: pdfUrl: ${pdfUrl}, fileIds: ${fileIds.join(
          ', ',
        )}, error: ${error.message}`,
      );
      throw error;
    }
  }

  @Process('generatePdf')
  async handlePdfGeneration(job: Job<GeneratePdfDto>) {
    this.logger.debug('Starting generating pdf...');
    this.logger.debug(job.data);
    const { fileIds, userId } = job.data;

    const summaries = await Promise.all(
      fileIds.map((fileId) => this.getSummaryFromPrisma(fileId)),
    );
    const pdfBuffer = await this.createPdf(summaries);
    await this.uploadPdf(fileIds.join('-'), pdfBuffer);
    const pdfUrl = `${this.storageBucket}/${this.storagePdfPath}/${fileIds.join(
      '-',
    )}.pdf`;
    await this.uploadToPrisma(pdfUrl, fileIds);
  }
}
