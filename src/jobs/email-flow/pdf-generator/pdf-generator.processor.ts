import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import { StorageConfig } from 'src/common/configs/config.interface';
import { PdfGeneratorDto } from './dto/pdfGenerator.dto';
import { UserBriefingOrderService } from 'src/common/prisma-related/user-related/UserBriefingOrder/user-briefing-order.service';
import { PdfGeneratorYoutubeVideo } from './types/videoSummaries.type';
import { BrieferPdfReportService } from 'src/common/prisma-related/BrieferPdfReport/briefer-pdf-report.service';
import { PdfGeneratorException } from './exceptions/pdf-generator.exceptions';
import * as PDFKit from 'pdfkit';

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

  private createDocFromData(
    data: PdfGeneratorYoutubeVideo[],
  ): PDFKit.PDFDocument {
    try {
      const doc = new PDFKit();
      doc.fontSize(25).text('BRIEFER', { align: 'center' });
      doc.moveDown(3);

      doc.fontSize(18).text('Table of Contents:');
      data.forEach((item, i) => {
        doc.fontSize(16).text(`${i + 1}. ${item.title}`);
      });

      data.forEach((item) => {
        doc.addPage().fontSize(20).text(item.title, { align: 'center' });
        doc.moveDown(2);

        doc
          .fontSize(16)
          .text('Summary:')
          .text(item.YoutubeVideoSummary.summary);
        doc.moveDown(1);
        doc.text(`Author: ${item.videoAuthor}`);
        doc.text(`URL: https://www.youtube.com/watch?v=${item.youtubeId}`);
      });

      return doc;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createPdf(data: PdfGeneratorYoutubeVideo[]): Promise<Buffer> {
    try {
      console.log('jonas1');
      const doc = this.createDocFromData(data);
      console.log('jonas2');

      const buffer = await this.createBufferFromDoc(doc);
      console.log('jonas4');

      return buffer;
    } catch (error) {
      this.handleError(error);
    }
  }

  private createBufferFromDoc(doc: PDFKit.PDFDocument): Promise<Buffer> {
    try {
      const chunks = [];
      return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));
        doc.end();
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
      this.logger.debug({ PDF_GENERATOR_WORKER_NEXT_QUEUE: sendEmail });
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
