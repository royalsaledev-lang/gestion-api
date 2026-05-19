import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Injectable()
export class EventsListener {
  constructor(private notifications: NotificationsService) {}

  @OnEvent('task.assigned')
  handleTaskAssigned(payload: any) {
    this.notifications.notifyUser(
      payload.assignedToId,
      'A task has been assigned to you',
    );
  }

  @OnEvent('project.created')
  handleProjectCreated(payload: any) {
    if (payload.managerId) {
      this.notifications.notifyUser(
        payload.managerId,
        'You have been assigned to a new project',
      );
    }
  }
}
