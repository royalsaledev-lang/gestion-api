import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../core/base/base.service';

import { ActivityService } from '../core/activity/activity.service';
import { EventBusService } from '../core/events/event-bus.service';
import { NotificationsService } from '../core/notifications/notifications.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from 'generated/prisma/enums';

@Injectable()
export class PaymentsService extends BaseService {
  constructor(
    prisma: PrismaService,
    private activity: ActivityService,
    private events: EventBusService,
    private notifications: NotificationsService,
  ) {
    super(prisma, prisma.payment);
  }

  // CREATE PAYMENT
  async createPayment(data: CreatePaymentDto, userId: string) {
    const payment = await this.prisma.payment.create({
      data: {
        ...data,
        status: data.status ?? PaymentStatus.NOT_PAID,
      },
      include: {
        project: true,
      },
    });

    await this.activity.log({
      action: 'PAYMENT_CREATED',
      userId,
      entityId: payment.id,
      entityType: 'PAYMENT',
    });

    this.events.emit('payment.created', payment);

    // notification simple (tu peux améliorer plus tard)
    if (payment.project?.managerId) {
      await this.notifications.notifyUser(
        payment.project.managerId,
        `Nouveau paiement ajouté: ${payment.amount}`,
      );
    }

    return payment;
  }

  // UPDATE PAYMENT
  async updatePayment(id: string, data: UpdatePaymentDto, userId: string) {
    const payment = await this.prisma.payment.update({
      where: { id },
      data,
      include: {
        project: true,
      },
    });

    await this.activity.log({
      action: 'PAYMENT_UPDATED',
      userId,
      entityId: id,
      entityType: 'PAYMENT',
    });

    this.events.emit('payment.updated', payment);

    return payment;
  }

  // GET PROJECT PAYMENTS
  async getProjectPayments(projectId: string) {
    return this.prisma.payment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 💰 DASHBOARD FINANCE
  async getFinanceStats() {
    const payments = await this.prisma.payment.findMany();

    const revenueReceived = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const revenueExpected = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      revenueReceived,
      revenueExpected,
    };
  }

  // 📊 REVENUE CHART (monthly)
  async getRevenueByMonth() {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'PAID',
      },
    });

    const monthly: Record<string, number> = {};

    payments.forEach((p) => {
      const month = new Date(p.createdAt).toLocaleString('default', {
        month: 'short',
      });

      monthly[month] = (monthly[month] || 0) + p.amount;
    });

    return Object.entries(monthly).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }
}
