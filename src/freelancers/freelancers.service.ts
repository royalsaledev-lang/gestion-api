import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../core/base/base.service';

import { ActivityService } from '../core/activity/activity.service';
import { EventBusService } from '../core/events/event-bus.service';
import { NotificationsService } from '../core/notifications/notifications.service';

import { CreateFreelancerDto } from './dto/create-freelancer.dto';
import { UpdateFreelancerDto } from './dto/update-freelancer.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ActivityActions } from 'src/core/activity/activity-actions.constant';
import { Events } from 'src/core/events/events.constants';
import { FreelancerStatus, UserRole } from 'generated/prisma/enums';
import { QueryFreelancerDto } from './dto/query-freelancer.dto';
import * as bcrypt from 'bcrypt';
import { UpdateMemberDto } from './dto/update-member.dto';

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
        members: true,
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
      include: {
        members: true,
      },
    });

    // 3. 🔥 IMPORTANT → connecter aussi comme MEMBER
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        freelancerId: freelancer.id,
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

  async getMembers(freelancerId: string) {
    return this.prisma.user.findMany({
      where: {
        freelancerId,
        role: UserRole.EXECUTANT,
        active: true, // 🔥 important
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });
  }

  async getMember(memberId: string, userId: string) {
    // 🔥 1. vérifier existence
    const prestataire = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        freelancerId: true,
        active: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // 🔥 blocage user inactif
    if (!member.active) {
      throw new ForbiddenException('Member is inactive');
    }

    // 🔥 contrôle d'accès
    if (prestataire.role === UserRole.PRESTATAIRE) {
      if (member.freelancerId !== prestataire.freelancerId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // 🔥 sécurité supplémentaire (optionnelle mais forte)
    if (prestataire.role === UserRole.EXECUTANT) {
      if (member.id !== prestataire.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return member;
  }

  // ADD MEMBER (équipe prestataire)
  async addMember(freelancerId: string, data: AddMemberDto, userId: string) {
    const hashedPassword = await bcrypt.hash('executant123', 10);

    // 🔥 1. vérifier si user existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    let member;

    if (existingUser) {
      // 🔥 2. sécurité métier
      if (
        existingUser.freelancerId &&
        existingUser.freelancerId !== freelancerId
      ) {
        throw new Error(
          'Cet utilisateur appartient déjà à un autre prestataire',
        );
      }

      // 🔥 3. rattacher ou mettre à jour
      member = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: data.name ?? existingUser.name,
          phone: data.phone ?? existingUser.phone,
          role: UserRole.EXECUTANT,
          freelancerId: freelancerId,
        },
      });
    } else {
      // 🔥 4. créer nouveau user
      member = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          role: UserRole.EXECUTANT,
          freelancerId: freelancerId,
        },
      });
    }

    // 🔥 activité
    await this.activity.log({
      action: ActivityActions.FREELANCER_MEMBER_ADDED,
      userId,
      entityId: freelancerId,
      entityType: 'FREELANCER',
    });

    // 🔥 event
    this.events.emit(Events.FREELANCER_MEMBER_ADDED, member);

    return member;
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
        members: true,
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
        members: true,
        user: true,
      },
    });

    if (!freelancer) throw new Error('Freelancer not found');

    // 🔥 1. détacher les members
    await this.prisma.user.updateMany({
      where: { freelancerId: id },
      data: { freelancerId: null },
    });

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

  async removeMember(memberId: string, userId: string) {
    // 🔥 1. vérifier existence
    const existing = await this.prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!existing) throw new Error('Member not found');

    // 🔥 2. détacher du freelancer + désactiver
    const member = await this.prisma.user.update({
      where: { id: memberId },
      data: {
        freelancerId: null,
        active: false, // 🔥 important (soft delete)
      },
    });

    await this.activity.log({
      action: ActivityActions.FREELANCER_MEMBER_REMOVED,
      userId,
      entityId: memberId,
      entityType: 'FREELANCER',
    });

    this.events.emit(Events.FREELANCER_MEMBER_REMOVED, member);

    return member;
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

  async updateMember(memberId: string, data: UpdateMemberDto, userId: string) {
    const member = await this.prisma.user.update({
      where: { id: memberId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    });

    await this.activity.log({
      action: ActivityActions.FREELANCER_MEMBER_UPDATED,
      userId,
      entityId: memberId,
      entityType: 'FREELANCER',
    });

    this.events.emit(Events.FREELANCER_MEMBER_UPDATED, member);

    return member;
  }
}
