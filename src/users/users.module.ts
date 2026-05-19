import { Module } from '@nestjs/common';

import { UsersService } from './users.service';

import { PrismaModule } from '../prisma/prisma.module';

import { ActivityService } from '../core/activity/activity.service';
import { LoggerService } from '../core/logging/logger.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [UsersController],

  providers: [UsersService, ActivityService, LoggerService],
})
export class UsersModule {}
