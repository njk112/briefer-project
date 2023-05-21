import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import {
  MailJetConfig,
  StorageConfig,
} from 'src/common/configs/config.interface';
import { MailjetService } from 'src/common/mailJet/mailJet.service';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { SendEmailDto } from 'src/youtube/dto/queue-jobs.dto';
@Processor('email-sender')
export class EmailSenderProcessor {
  private storageBucket: string;
  private storagePdfPath: string;
  private fromEmail: string;
  private fromName: string;
  private subject: string;
  private text: string;
  private contentType: string;
  constructor(
    private supabaseService: SupabaseService,
    private prismaService: PrismaService,
    private configService: ConfigService,
    private mailJetService: MailjetService,
  ) {
    this.storageBucket =
      this.configService.get<StorageConfig>('storage').bucket;
    this.storagePdfPath =
      this.configService.get<StorageConfig>('storage').pdfPath;

    this.fromEmail = this.configService.get<MailJetConfig>('mailJet').fromEmail;
    this.fromName = this.configService.get<MailJetConfig>('mailJet').fromName;
    this.subject = this.configService.get<MailJetConfig>('mailJet').subject;
    this.text = this.configService.get<MailJetConfig>('mailJet').text;
    this.contentType =
      this.configService.get<MailJetConfig>('mailJet').contentType;
  }
  private readonly logger = new Logger(EmailSenderProcessor.name);

  async downloadPdfFile(fileId: string) {
    try {
      const data = await this.supabaseService.downloadFile({
        bucket: this.storageBucket,
        path: this.storagePdfPath,
        fileName: `${fileId}.pdf`,
      });
      return data;
    } catch (error) {
      this.logger.error(
        `SEND_EMAIL_WORKER: Error downloading pdf file: fileId: ${fileId}, error: ${error.message}`,
      );
      throw error;
    }
  }

  async updatePrisma(fileId: string) {
    try {
      await this.prismaService.brieferPdfReports.update({
        data: {
          isSent: true,
        },
        where: {
          id: fileId,
        },
      });
    } catch (error) {
      throw { PRISMA_ERROR: { fileId, error } };
    }
  }

  @Process('sendEmail')
  async sendEmail(job: Job<SendEmailDto>) {
    this.logger.debug('Starting sending email...');
    this.logger.debug(job.data);
    const { fileId, userId } = job.data;
    const pdfFile = await this.downloadPdfFile(fileId);
    const arrayBuffer = await new Response(pdfFile).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('buffer created');

    const email = {
      to: 'njkazlauskas@gmail.com',
      from: this.fromEmail,
      fromName: this.fromName,
      subject: this.subject,
      text: this.text,
      buffer,
      fileName: fileId,
      contentType: this.contentType,
    };

    const isSent = await this.mailJetService.sendEmail(email);
    if (isSent) {
      await this.updatePrisma(fileId);
    }
  }
}
