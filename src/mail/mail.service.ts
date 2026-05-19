import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailer: MailerService) {}

  async sendNotificationEmail(to: string, subject: string, context: any) {
    await this.mailer.sendMail({
      to,
      subject,
      template: 'notification',
      context,
    });
  }
}
