import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../core/base/base.service';

import { ActivityService } from '../core/activity/activity.service';
import { EventBusService } from '../core/events/event-bus.service';
import { NotificationsService } from '../core/notifications/notifications.service';

import { CreateFreelancerDto } from './dto/create-freelancer.dto';
import { UpdateFreelancerDto } from './dto/update-freelancer.dto';
import { ActivityActions } from 'src/core/activity/activity-actions.constant';
import { Events } from 'src/core/events/events.constants';
import { FreelancerStatus, UserRole } from 'generated/prisma/enums';
import { QueryFreelancerDto } from './dto/query-freelancer.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FreelancersService extends BaseService {
  constructor(
    prisma: PrismaService,
    private activity: ActivityService,
    private events: EventBusService,
    private notifications: NotificationsService,
  ) {
    super(prisma, prisma.freelancer);
  }

  async findAll(query: QueryFreelancerDto) {
    return this.prisma.freelancer.findMany({
      where: {
        ...(query.search && {
          name: {
            contains: query.search,
          },
        }),

        ...(query.status && {
          status: query.status as any,
        }),
      },
      include: {
        user: true,
        projects: {
          include: {
            project: true,
          },
        },
      },
    });
  }

  // async findAll() {
  //   return this.prisma.freelancer.findMany({
  //     include: {
  //       members: true,
  //       projects: {
  //         select: {
  //           project: {
  //             select: {
  //               id: true,
  //               name: true,
  //               status: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  // }

  // CREATE
  async createFreelancer(data: CreateFreelancerDto, userId: string) {
    const hashedPassword = await bcrypt.hash('prestataire123', 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email!,
        password: hashedPassword, // ou généré
        role: UserRole.PRESTATAIRE,
      },
    });

    const freelancer = await this.prisma.freelancer.create({
      data: {
        ...data,
        status: data.status ?? FreelancerStatus.ACTIVE,
        userId: user.id,
      },
    });

    await this.activity.log({
      action: ActivityActions.FREELANCER_CREATED,
      userId,
      entityId: freelancer.id,
      entityType: 'FREELANCER',
    });

    this.events.emit(Events.FREELANCER_CREATED, freelancer);

    return freelancer;
  }

  // UPDATE
  async updateFreelancer(
    id: string,
    data: UpdateFreelancerDto,
    userId: string,
  ) {
    const freelancer = await this.prisma.freelancer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!freelancer) {
      throw new Error('Freelancer not found');
    }

    // 🔥 update freelancer
    const updatedFreelancer = await this.prisma.freelancer.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        specialty: data.specialty,
        status: data.status,
      },
    });

    // 🔥 sync USER (owner PRESTATAIRE)
    if (freelancer.userId) {
      await this.prisma.user.update({
        where: { id: freelancer.userId },
        data: {
          name: data.name ?? undefined,
          email: data.email ?? undefined,
          phone: data.phone ?? undefined,
        },
      });
    }

    await this.activity.log({
      action: ActivityActions.FREELANCER_UPDATED,
      userId,
      entityId: id,
      entityType: 'FREELANCER',
    });

    this.events.emit(Events.FREELANCER_UPDATED, updatedFreelancer);

    return updatedFreelancer;
  }
  // ASSIGN PROJECT
  async assignToProject(
    freelancerId: string,
    projectId: string,
    userId: string,
  ) {
    const assignment = await this.prisma.projectFreelancer.create({
      data: {
        projectId,
        freelancerId,
      },
    });

    await this.activity.log({
      action: ActivityActions.FREELANCER_ASSIGNED_TO_PROJECT,
      userId,
      entityId: projectId,
      entityType: 'PROJECT',
    });

    this.events.emit(Events.FREELANCER_ASSIGNED, assignment);

    return assignment;
  }

  // GET FULL PROFILE (important pour frontend)
  async getFreelancerFull(id: string) {
    return this.prisma.freelancer.findUnique({
      where: { id },
      include: {
        user: true,
        projects: {
          include: {
            project: true,
          },
        },
      },
    });
  }

  async deleteFreelancer(id: string, userId: string) {
    const freelancer = await this.prisma.freelancer.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!freelancer) throw new Error('Freelancer not found');

    // 🔥 2. supprimer relations projet
    await this.prisma.projectFreelancer.deleteMany({
      where: { freelancerId: id },
    });

    // 🔥 3. supprimer freelancer
    await this.prisma.freelancer.delete({
      where: { id },
    });

    // 🔥 4. supprimer owner user
    await this.prisma.user.delete({
      where: { id: freelancer.userId },
    });

    await this.activity.log({
      action: ActivityActions.FREELANCER_DELETED,
      userId,
      entityId: id,
      entityType: 'FREELANCER',
    });

    this.events.emit(Events.FREELANCER_DELETED, freelancer);

    return freelancer;
  }

  async unassignFromProject(
    freelancerId: string,
    projectId: string,
    userId: string,
  ) {
    const relation = await this.prisma.projectFreelancer.deleteMany({
      where: {
        freelancerId,
        projectId,
      },
    });

    await this.activity.log({
      action: ActivityActions.FREELANCER_UNASSIGNED_FROM_PROJECT,
      userId,
      entityId: projectId,
      entityType: 'PROJECT',
    });

    this.events.emit(Events.FREELANCER_UNASSIGNED, relation);

    return relation;
  }
}
