import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { ActivityService } from '../core/activity/activity.service';
import { NotificationsService } from '../core/notifications/notifications.service';
import { EventBusService } from '../core/events/event-bus.service';
import { ProjectsController } from './project.controller';
import { ProjectsService } from './project.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [ProjectsController],

  providers: [
    ProjectsService,
    ActivityService,
    NotificationsService,
    EventBusService,
  ],
})
export class ProjectsModule {}
