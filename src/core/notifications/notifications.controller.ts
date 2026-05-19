import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from '../permissions/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  getMyNotifications(@CurrentUser() user) {
    return this.notifications.getUserNotifications(user.userId);
  }

  @Get('unread-count')
  getUnread(@CurrentUser() user) {
    return this.notifications.getUnreadCount(user.userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notifications.markAsRead(id);
  }

  @Patch('read-all')
  markAll(@CurrentUser() user) {
    return this.notifications.markAllAsRead(user.userId);
  }
}
