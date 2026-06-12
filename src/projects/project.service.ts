import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../core/base/base.service';

import { ActivityService } from '../core/activity/activity.service';
import { NotificationsService } from '../core/notifications/notifications.service';
import { EventBusService } from '../core/events/event-bus.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ActivityActions } from 'src/core/activity/activity-actions.constant';
import { Events } from 'src/core/events/events.constants';
import { ProjectStatus } from 'generated/prisma/enums';
import { QueryProjectDto } from './dto/query-project.dto';

@Injectable()
export class ProjectsService extends BaseService {
  constructor(
    prisma: PrismaService,
    private activity: ActivityService,
    private notifications: NotificationsService,
    private events: EventBusService,
  ) {
    super(prisma, prisma.project);
  }

  async findAllProject(user: any, query: QueryProjectDto) {
    const filters = {
      ...(query.search && {
        name: {
          contains: query.search,
        },
      }),

      ...(query.status && {
        status: query.status as any,
      }),
    };

    // ADMIN
    if (user.role === 'ADMIN') {
      return this.prisma.project.findMany({
        where: filters,
        include: {
          client: true,
          manager: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    // MANAGER
    if (user.role === 'MANAGER') {
      return this.prisma.project.findMany({
        where: {
          ...filters,
          managerId: user.userId,
        },
        include: {
          client: true,
          manager: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    // EXECUTANT + PRESTATAIRE
    return this.prisma.project.findMany({
      where: {
        ...filters,

        participants: {
          some: {
            userId: user.userId,
          },
        },
      },

      include: {
        client: true,
        manager: true,

        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },

      include: {
        client: true,

        manager: true,

        participants: {
          include: {
            user: true,
          },
        },

        tasks: {
          include: {
            assignedTo: true,
            createdBy: true,
          },
        },
      },
    });
  }

  async createProject(data: CreateProjectDto, userId: string) {
    const project = await this.prisma.project.create({
      data: {
        ...data,
        managerId: data.managerId || userId,
        clientId: data.clientId || null,
        status: data.status ?? ProjectStatus.UPCOMING,
      },

      include: {
        client: true,
        manager: true,
      },
    });

    await this.activity.log({
      action: ActivityActions.PROJECT_CREATED,

      userId,

      entityId: project.id,

      entityType: 'PROJECT',
    });

    this.events.emit(Events.PROJECT_CREATED, project);

    return project;
  }

  async updateProject(id: string, data: UpdateProjectDto, userId: string) {
    const updateData: any = {
      ...data,
    };

    // 🔥 manager
    if (data.managerId === '' || data.managerId === undefined) {
      delete updateData.managerId;
    }

    // 🔥 client
    if (data.clientId === '' || data.clientId === undefined) {
      delete updateData.clientId;
    }

    const project = await this.prisma.project.update({
      where: { id },

      data: updateData,

      include: {
        client: true,
        manager: true,
      },
    });

    await this.activity.log({
      action: ActivityActions.PROJECT_UPDATED,

      userId,

      entityId: id,

      entityType: 'PROJECT',
    });

    this.events.emit(Events.PROJECT_UPDATED, project);

    return project;
  }

  async assignParticipant(projectId: string, userId: string) {
    const exists = await this.prisma.projectParticipant.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (exists) {
      return exists;
    }

    return this.prisma.projectParticipant.create({
      data: {
        projectId,
        userId,
      },

      include: {
        user: true,
        project: true,
      },
    });
  }

  async removeParticipant(projectId: string, userId: string) {
    return this.prisma.projectParticipant.deleteMany({
      where: {
        projectId,
        userId,
      },
    });
  }

  async getParticipants(projectId: string) {
    return this.prisma.projectParticipant.findMany({
      where: {
        projectId,
      },

      include: {
        user: true,
      },
    });
  }
}
