import { Module } from '@nestjs/common';

import { EventBusService } from './events/event-bus.service';
import { ActivityService } from './activity/activity.service';
import { NotificationsService } from './notifications/notifications.service';
import { LoggerService } from './logging/logger.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    EventBusService,
    ActivityService,
    NotificationsService,
    LoggerService,
  ],
  exports: [
    EventBusService,
    ActivityService,
    NotificationsService,
    LoggerService,
  ],
})
export class CoreModule {}
