import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';

import { ActivityService } from './activity.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from '../permissions/roles.guard';
import { Roles } from '../permissions/role.decorator';

@Controller('activity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  // 🔥 GLOBAL FEED (dashboard)
  @Get()
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
  getFeed(@Query() query: any) {
    return this.activityService.getFeed(query);
  }

  // 🎯 PROJECT FEED
  @Get('project/:id')
  @Roles('ADMIN', 'MANAGER', 'PRESTATAIRE')
  getProjectFeed(@Param('id') id: string) {
    return this.activityService.getProjectFeed(id);
  }

  // 👤 USER FEED
  @Get('user/:id')
  @Roles('ADMIN', 'MANAGER')
  getUserFeed(@Param('id') id: string) {
    return this.activityService.getUserFeed(id);
  }
}
