import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface LogActivityParams {
  action: string;
  entityId: string;
  entityType: 'PROJECT' | 'TASK' | 'PAYMENT' | 'CLIENT' | 'USER' | 'FREELANCER';
  userId?: string;
}

interface ActivityQuery {
  userId?: string;
  entityType?: string;
  entityId?: string;
  take?: number;
  skip?: number;
}

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  // 🔥 LOG (inchangé)
  async log(params: LogActivityParams) {
    return this.prisma.activityLog.create({
      data: params,
    });
  }

  // 🚀 GLOBAL FEED
  async getFeed(query: ActivityQuery) {
    const { userId, entityType, entityId, take = 20, skip = 0 } = query;

    return this.prisma.activityLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      take,
      skip,
    });
  }

  // 🎯 FEED PAR PROJET
  async getProjectFeed(projectId: string) {
    return this.prisma.activityLog.findMany({
      where: {
        entityType: 'PROJECT',
        entityId: projectId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 👤 FEED UTILISATEUR
  async getUserFeed(userId: string) {
    return this.prisma.activityLog.findMany({
      where: {
        userId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
