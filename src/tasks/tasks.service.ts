import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../core/base/base.service';

import { ActivityService } from '../core/activity/activity.service';
import { NotificationsService } from '../core/notifications/notifications.service';
import { EventBusService } from '../core/events/event-bus.service';
import { LoggerService } from '../core/logging/logger.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

import { Events } from '../core/events/events.constants';
import { ActivityActions } from 'src/core/activity/activity-actions.constant';
import { TaskStatus } from 'generated/prisma/enums';

@Injectable()
export class TasksService extends BaseService {
  constructor(
    prisma: PrismaService,
    private activity: ActivityService,
    private notifications: NotificationsService,
    private events: EventBusService,
    private logger: LoggerService,
  ) {
    super(prisma, prisma.task);
  }

  async findAll() {
    return this.prisma.task.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createTask(data: CreateTaskDto, userId: string, role: string) {
    let assignedToId: string | undefined = data.assignedToId;

    if (!assignedToId && role === 'PRESTATAIRE') {
      assignedToId = userId;
    }

    // ✅ vérifier existence user
    if (assignedToId) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true },
      });

      if (!userExists) {
        throw new BadRequestException('Assigned user not found');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        ...data,
        status: data.status ?? TaskStatus.DRAFT,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        createdById: userId,
        assignedToId,
      },
      include: {
        project: true,
        assignedTo: true,
      },
    });

    await this.activity.log({
      action: ActivityActions.TASK_CREATED,
      entityType: 'TASK',
      entityId: task.id,
      userId,
    });

    if (assignedToId) {
      await this.notifications.notifyUser(
        assignedToId,
        'A new task has been assigned to you',
      );
    }

    this.events.emit(Events.TASK_CREATED, task);

    return task;
  }

  async updateTask(id: string, data: UpdateTaskDto, userId: string) {
    const existing = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Task not found');
    }

    // 🔥 convertir les dates si présentes
    const updateData: any = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    };

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        assignedTo: true,
      },
    });

    // 🔥 si assignation changée → notifier
    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      await this.notifications.notifyUser(
        data.assignedToId,
        'A task has been assigned to you',
      );
    }

    await this.activity.log({
      action: ActivityActions.TASK_UPDATED,
      entityType: 'TASK',
      entityId: id,
      userId,
    });

    this.events.emit(Events.TASK_UPDATED, task);

    return task;
  }

  async assignTask(taskId: string, userId: string, assignedBy: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new BadRequestException('Task not found');
    }

    const participant = await this.prisma.projectParticipant.findFirst({
      where: {
        projectId: task.projectId,
        userId,
      },
    });

    if (!participant) {
      throw new BadRequestException('User is not participant of this project');
    }

    const updatedTask = await this.prisma.task.update({
      where: {
        id: taskId,
      },

      data: {
        assignedToId: userId,
      },

      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.activity.log({
      action: ActivityActions.TASK_ASSIGNED,
      entityType: 'TASK',
      entityId: taskId,
      userId: assignedBy,
    });

    await this.notifications.notifyUser(
      userId,
      'A task has been assigned to you',
    );

    this.events.emit(Events.TASK_ASSIGNED, updatedTask);

    this.logger.logAction('Task assigned', 'TasksService');

    return updatedTask;
  }

  async rejectTask(taskId: string, userId: string) {
    return this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: 'DRAFT',
        validatedById: null,
      },
    });
  }

  async completeTask(taskId: string, userId: string) {
    const task = await this.prisma.task.update({
      where: { id: taskId },

      data: {
        status: TaskStatus.VALIDATION_REQUESTED,
      },
    });

    await this.activity.log({
      action: ActivityActions.TASK_VALIDATED_REQUESTED,
      entityType: 'TASK',
      entityId: taskId,
      userId,
    });

    this.events.emit(Events.TASK_VALIDATED_REQUESTED, task);

    return task;
  }

  async changeStatus(taskId: string, status: TaskStatus, userId: string) {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { status },
    });

    await this.activity.log({
      action: ActivityActions.TASK_STATUS_CHANGED,
      entityType: 'TASK',
      entityId: taskId,
      userId,
    });

    this.events.emit(Events.TASK_UPDATED, task);

    return task;
  }

  async finalApprove(taskId: string, user: any) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const updated = await this.prisma.task.update({
      where: {
        id: taskId,
      },

      data: {
        validatedById: user.userId,
        status: TaskStatus.COMPLETED,
      },
    });

    await this.activity.log({
      action: ActivityActions.TASK_VALIDATED_MANAGER,
      entityType: 'TASK',
      entityId: taskId,
      userId: user.userId,
    });

    return updated;
  }
}

//   async submitForValidation(taskId: string, user: any) {
//     const task = await this.prisma.task.findUnique({
//       where: { id: taskId },
//     });

//     if (!task) throw new Error('Task not found');

//     const updated = await this.prisma.task.update({
//       where: { id: taskId },
//       data: {
//         status: TaskStatus.VALIDATION_REQUESTED,
//       },
//     });

//     await this.activity.log({
//       action: ActivityActions.TASK_SUBMITTED,
//       entityType: 'TASK',
//       entityId: taskId,
//       userId: user.userId,
//     });

//     // notifier manager
//     const project = await this.prisma.project.findUnique({
//       where: { id: task.projectId },
//     });

//     if (project?.managerId) {
//       await this.notifications.notifyUser(
//         project.managerId,
//         'Task requires validation',
//       );
//     }

//     this.events.emit(Events.TASK_UPDATED, updated);

//     return updated;
//   }

// @Injectable()
// export class TasksService extends BaseService {
//   constructor(
//     prisma: PrismaService,
//     private activity: ActivityService,
//     private notifications: NotificationsService,
//     private events: EventBusService,
//     private logger: LoggerService,
//   ) {
//     super(prisma, prisma.task);
//   }

//   async createTask(data: CreateTaskDto, userId: string) {
//     const task = await this.prisma.task.create({
//       data: {
//         ...data,
//         status: data.status ?? TaskStatus.DRAFT,
//         createdById: userId,
//       },
//       include: {
//         project: true,
//         assignedTo: true,
//       },
//     });

//     await this.activity.log({
//       action: ActivityActions.TASK_CREATED,
//       entityType: 'TASK',
//       entityId: task.id,
//       userId,
//     });

//     if (task.assignedToId) {
//       await this.notifications.notifyUser(
//         task.assignedToId,
//         'A new task has been assigned to you'
//       );
//     }

//     this.events.emit(Events.TASK_CREATED, task);

//     this.logger.logAction('Task created', 'TasksService');

//     return task;
//   }

//   async updateTask(id: string, data: UpdateTaskDto, userId: string) {
//     const task = await this.prisma.task.update({
//       where: { id },
//       data,
//       include: {
//         project: true,
//         assignedTo: true,
//       },
//     });

//     await this.activity.log({
//       action: ActivityActions.TASK_UPDATED,
//       entityType: 'TASK',
//       entityId: id,
//       userId,
//     });

//     this.events.emit(Events.TASK_UPDATED, task);

//     this.logger.logAction('Task updated', 'TasksService');

//     return task;
//   }

//   async assignTask(taskId: string, userId: string, assignedBy: string) {
//     const task = await this.prisma.task.update({
//       where: { id: taskId },
//       data: {
//         assignedToId: userId,
//       },
//     });

//     await this.activity.log({
//       action: ActivityActions.TASK_ASSIGNED,
//       entityType: 'TASK',
//       entityId: taskId,
//       userId: assignedBy,
//     });

//     this.events.emit(Events.TASK_ASSIGNED, task);

//     await this.notifications.notifyUser(
//       userId,
//       'A task has been assigned to you'
//     );

//     this.logger.logAction('Task assigned', 'TasksService');

//     return task;
//   }

//   async completeTask(taskId: string, userId: string) {
//     const task = await this.prisma.task.update({
//       where: { id: taskId },
//       data: {
//         status: TaskStatus.COMPLETED,
//       },
//     });

//     await this.activity.log({
//       action: ActivityActions.TASK_COMPLETED,
//       entityType: 'TASK',
//       entityId: taskId,
//       userId,
//     });

//     this.events.emit(Events.TASK_COMPLETED, task);

//     this.logger.logAction('Task completed', 'TasksService');

//     return task;
//   }

//   async changeStatus(taskId: string, status: TaskStatus, userId: string) {
//     const task = await this.prisma.task.update({
//       where: { id: taskId },
//       data: { status },
//     });

//     await this.activity.log({
//       action: ActivityActions.TASK_STATUS_CHANGED,
//       entityType: 'TASK',
//       entityId: taskId,
//       userId,
//     });

//     this.events.emit(Events.TASK_UPDATED, task);

//     return task;
//   }
// }
