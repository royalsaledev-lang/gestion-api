import { Module } from '@nestjs/common';

import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

import { PrismaModule } from '../prisma/prisma.module';

import { ActivityService } from '../core/activity/activity.service';
import { NotificationsService } from '../core/notifications/notifications.service';
import { EventBusService } from '../core/events/event-bus.service';
import { LoggerService } from '../core/logging/logger.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [TasksController],

  providers: [
    TasksService,
    ActivityService,
    NotificationsService,
    EventBusService,
    LoggerService,
  ],
})
export class TasksModule {}
