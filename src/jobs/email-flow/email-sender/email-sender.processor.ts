import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import {
  MailJetConfig,
  StorageConfig,
} from 'src/common/configs/config.interface';
import { MailjetService } from 'src/common/mailJet/mailJet.service';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { EmailSendDto } from './dto/emailSendDto';
import { BrieferPdfReportService } from 'src/common/prisma-related/BrieferPdfReport/briefer-pdf-report.service';
import { UserService } from 'src/common/prisma-related/user-related/User/user.service';
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
    private configService: ConfigService,
    private mailJetService: MailjetService,
    private userService: UserService,
    private brieferPdfReportService: BrieferPdfReportService,
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

  async downloadPdfFile(fileName: string) {
    try {
      const data = await this.supabaseService.downloadFile({
        bucket: this.storageBucket,
        path: this.storagePdfPath,
        fileName,
      });
      return data;
    } catch (error) {
      this.logger.error(
        `SEND_EMAIL_WORKER: Error downloading pdf file: fileId: ${fileName}, error: ${error.message}`,
      );
      throw error;
    }
  }

  @Process('sendEmail')
  async sendEmail(job: Job<EmailSendDto>) {
    this.logger.debug('Starting sending email...');
    this.logger.debug(job.data);
    const { brieferPdfReportId, userId } = job.data;

    const pdfReport = await this.brieferPdfReportService.getBrieferPdfReport({
      id: brieferPdfReportId,
    });

    if (pdfReport?.isSent) {
      this.logger.debug('Report has been already sent');
    } else {
      const pdfFile = await this.downloadPdfFile(pdfReport.fileName);
      const arrayBuffer = await new Response(pdfFile).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const user = await this.userService.getUser({ id: userId });

      const email = {
        to: user.email,
        from: this.fromEmail,
        fromName: this.fromName,
        subject: this.subject,
        text: `${this.text} for ${pdfReport.fileName}`,
        buffer,
        fileName: pdfReport.fileName,
        contentType: this.contentType,
      };

      const isSent = await this.mailJetService.sendEmail(email);
      if (isSent) {
        await this.brieferPdfReportService.updateBrieferPdfReport(
          { id: pdfReport.id },
          { isSent: true },
        );
      }
      this.logger.debug('Email sent');
    }
  }
}
