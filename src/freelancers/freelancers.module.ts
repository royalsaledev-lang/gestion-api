import { Module } from '@nestjs/common';
import { FreelancersService } from './freelancers.service';
import { FreelancersController } from './freelancers.controller';
import { LoggerService } from 'src/core/logging/logger.service';
import { ActivityService } from 'src/core/activity/activity.service';
import { EventBusService } from 'src/core/events/event-bus.service';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FreelancersController],
  providers: [
    FreelancersService,
    ActivityService,
    LoggerService,
    EventBusService,
    NotificationsService,
  ],
})
export class FreelancersModule {}
