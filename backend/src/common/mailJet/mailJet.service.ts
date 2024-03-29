import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'node-mailjet';
import { MailJetConfig } from '../configs/config.interface';
import { SendEmailDto } from './dtos/sendMail.dto';
import { MailJetException } from './exceptions/mailJet.exceptions';

@Injectable()
export class MailjetService {
  private readonly logger = new Logger(MailjetService.name);
  private mailjet: Client;

  constructor(private configService: ConfigService) {
    this.mailjet = Client.apiConnect(
      this.configService.get<MailJetConfig>('mailJet').apiKey,
      this.configService.get<MailJetConfig>('mailJet').apiSecret,
    );
  }

  private handleError(error: any) {
    const mailJetError = new MailJetException(error.message);
    this.logger.error(mailJetError);
    throw error;
  }

  async sendEmail(emailDetails: SendEmailDto): Promise<boolean> {
    const base64File = emailDetails.buffer.toString('base64');

    const request = this.mailjet.post('send').request({
      FromEmail: emailDetails.from,
      FromName: emailDetails.fromName,
      Subject: emailDetails.subject,
      'Text-part': emailDetails.text,
      Recipients: [{ Email: emailDetails.to }],
      Attachments: [
        {
          'Content-type': emailDetails.contentType,
          Filename: emailDetails.fileName,
          content: base64File,
        },
      ],
    });

    try {
      const result = await request;
      this.logger.debug(
        `MAILJET_SERVICE: Email sent successfully. Result: ${result.response.status}`,
      );
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }
}
