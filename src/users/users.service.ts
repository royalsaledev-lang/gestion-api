import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { BaseService } from '../core/base/base.service';

import { ActivityService } from '../core/activity/activity.service';
import { LoggerService } from '../core/logging/logger.service';

import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ActivityActions } from 'src/core/activity/activity-actions.constant';

@Injectable()
export class UsersService extends BaseService {
  constructor(
    prisma: PrismaService,
    private activity: ActivityService,
    private logger: LoggerService,
  ) {
    super(prisma, prisma.user);
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createUser(
    data: CreateUserDto,
    creatorId: string,
    creatorRole: string,
  ) {
    const allowedRoles: Record<string, string[]> = {
      ADMIN: ['MANAGER', 'PRESTATAIRE', 'EXECUTANT'],
      MANAGER: ['PRESTATAIRE', 'EXECUTANT'],
      PRESTATAIRE: ['EXECUTANT'],
      EXECUTANT: [],
    };

    const allowed = allowedRoles[creatorRole];

    if (!allowed.includes(data.role)) {
      throw new Error(`${creatorRole} cannot create ${data.role}`);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    await this.activity.log({
      action: ActivityActions.USER_CREATED,
      entityType: 'USER',
      entityId: user.id,
      userId: creatorId,
    });

    this.logger.logAction('User created', 'UsersService');

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto, userId: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    await this.activity.log({
      action: ActivityActions.USER_UPDATED,
      entityType: 'USER',
      entityId: id,
      userId,
    });

    return user;
  }

  async toggleUserStatus(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        active: !user.active, // 🔥 toggle
      },
    });

    await this.activity.log({
      action: updatedUser.active
        ? ActivityActions.USER_ACTIVATED
        : ActivityActions.USER_DEACTIVATED,
      entityType: 'USER',
      entityId: id,
      userId: adminId,
    });

    return updatedUser;
  }
  async findOne(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }
}
