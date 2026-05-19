import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { BaseService } from '../core/base/base.service';
import { ActivityService } from '../core/activity/activity.service';
import { LoggerService } from '../core/logging/logger.service';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { ActivityActions } from 'src/core/activity/activity-actions.constant';

@Injectable()
export class ClientsService extends BaseService {
  constructor(
    prisma: PrismaService,
    private activity: ActivityService,
    private logger: LoggerService,
  ) {
    super(prisma, prisma.client);
  }

  async createClient(data: CreateClientDto, userId: string) {
    const client = await this.prisma.client.create({
      data,
    });

    await this.activity.log({
      action: ActivityActions.CLIENT_CREATED,
      entityType: 'CLIENT',
      entityId: client.id,
      userId,
    });

    this.logger.logAction('Client created', 'ClientsService');

    return client;
  }

  async updateClient(id: string, data: UpdateClientDto, userId: string) {
    const client = await this.prisma.client.update({
      where: { id },
      data,
    });

    await this.activity.log({
      action: ActivityActions.CLIENT_UPDATED,
      entityType: 'CLIENT',
      entityId: id,
      userId,
    });

    return client;
  }

  async deleteClient(id: string, userId: string) {
    await this.prisma.client.delete({
      where: { id },
    });

    await this.activity.log({
      action: ActivityActions.CLIENT_DELETED,
      entityType: 'CLIENT',
      entityId: id,
      userId,
    });

    return { message: 'Client deleted' };
  }

  async findAll(query: QueryClientDto) {
    return this.prisma.client.findMany({
      where: {
        ...(query.search && {
          name: {
            contains: query.search,
            
          },
        }),

        ...(query.status && {
          status: query.status as any,
        }),
      },

      include: {
        projects: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
