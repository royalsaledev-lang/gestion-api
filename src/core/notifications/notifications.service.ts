import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // 🔥 créer notification simple
  async createNotification(userId: string, message: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        message,
      },
    });
  }

  // 🔥 alias propre (utilisé partout dans ton app)
  async notifyUser(userId: string, message: string) {
    return this.createNotification(userId, message);
  }

  // 🔥 notifier plusieurs utilisateurs
  async notifyUsers(userIds: string[], message: string) {
    return this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        message,
      })),
    });
  }

  // 🔥 récupérer notifications utilisateur
  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🔥 unread count
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  // 🔥 mark as read
  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  // 🔥 mark all as read
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }
}

// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';

// @Injectable()
// export class NotificationsService {
//   constructor(private prisma: PrismaService) {}

//   // 🔔 créer notification simple
//   async createNotification(userId: string, message: string) {
//     return this.prisma.notification.create({
//       data: {
//         userId,
//         message,
//       },
//     });
//   }

//   // ✅ alias propre (utilisé dans tout le projet)
//   async notifyUser(userId: string, message: string) {
//     return this.createNotification(userId, message);
//   }

//   // 🔥 notification multiple (très utile plus tard)
//   async notifyMany(userIds: string[], message: string) {
//     return this.prisma.notification.createMany({
//       data: userIds.map((userId) => ({
//         userId,
//         message,
//       })),
//     });
//   }

//   // 📥 récupérer notifications utilisateur
//   async getUserNotifications(userId: string) {
//     return this.prisma.notification.findMany({
//       where: { userId },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   // ✔ marquer comme lu
//   async markAsRead(id: string) {
//     return this.prisma.notification.update({
//       where: { id },
//       data: { read: true },
//     });
//   }
// }
