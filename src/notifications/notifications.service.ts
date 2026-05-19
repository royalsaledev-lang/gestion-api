import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private mail: MailService,
  ) {}

  async notifyUser(userId: string, message: string) {
    // 🔥 1. DB
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        message,
      },
    });

    // 🔥 2. REAL-TIME
    this.gateway.sendToUser(userId, notification);

    // 🔥 3. EMAIL
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.email) {
      await this.mail.sendNotificationEmail(user.email, 'Notification', {
        title: 'New Notification',
        message,
      });
    }

    return notification;
  }
}
