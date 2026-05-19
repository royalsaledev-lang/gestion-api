import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ClientsService } from './clients.service';
import { AuthModule } from 'src/auth/auth.module';
import { ClientsController } from './clients.controller';
import { ActivityService } from 'src/core/activity/activity.service';
import { LoggerService } from 'src/core/logging/logger.service';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [ClientsController],

  providers: [ClientsService, ActivityService, LoggerService],
})
export class ClientsModule {}
