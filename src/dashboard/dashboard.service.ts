import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [clients, projects, tasks, freelancers, activities, payments] =
      await Promise.all([
        this.prisma.client.findMany(),
        this.prisma.project.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        }),
        this.prisma.task.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        }),
        this.prisma.freelancer.findMany(),
        this.prisma.activityLog.findMany({
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        }),
        this.prisma.payment.findMany(),
      ]);

    const revenueExpected = payments.reduce((sum, p) => sum + p.amount, 0);

    const revenueReceived = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const revenueData = [
      {
        month: new Date().toLocaleString('fr-FR', {
          month: 'short',
        }),
        revenue: revenueReceived,
      },
    ];

    return {
      stats: {
        totalClients: clients.length,
        activeClients: clients.filter((c) => c.status === 'ACTIVE').length,
        clientsToFollow: clients.filter((c) => c.status === 'TO_FOLLOW').length,

        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === 'IN_PROGRESS')
          .length,
        completedProjects: projects.filter((p) => p.status === 'COMPLETED')
          .length,
        blockedProjects: projects.filter((p) => p.status === 'BLOCKED').length,

        tasksInProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
        tasksCompleted: tasks.filter((t) => t.status === 'COMPLETED').length,

        tasksLate: tasks.filter(
          (t) =>
            t.deadline &&
            new Date(t.deadline) < new Date() &&
            t.status !== 'COMPLETED',
        ).length,

        freelancersActive: freelancers.length,

        revenueExpected,
        revenueReceived,
      },

      revenueData,
      projects,
      tasks,
      activities,
    };
  }
}

// import { Injectable } from '@nestjs/common';

// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class DashboardService {
//   constructor(private prisma: PrismaService) {}

//   async getDashboard() {
//     const [clients, projects, tasks, freelancers, activities, payments] =
//       await Promise.all([
//         this.prisma.client.findMany(),
//         this.prisma.project.findMany(),
//         this.prisma.task.findMany(),
//         this.prisma.freelancer.findMany(),
//         this.prisma.activityLog.findMany({
//           include: {
//             user: true,
//           },
//           orderBy: {
//             createdAt: 'desc',
//           },
//           take: 20,
//         }),
//         this.prisma.payment.findMany(),
//       ]);

//     const revenueExpected = payments.reduce((sum, p) => sum + p.amount, 0);

//     const revenueReceived = payments
//       .filter((p) => p.status === 'PAID')
//       .reduce((sum, p) => sum + p.amount, 0);

//     return {
//       stats: {
//         totalClients: clients.length,

//         activeClients: clients.filter((c) => c.status === 'ACTIVE').length,

//         clientsToFollow: clients.filter((c) => c.status === 'TO_FOLLOW').length,

//         totalProjects: projects.length,

//         activeProjects: projects.filter((p) => p.status === 'IN_PROGRESS')
//           .length,

//         completedProjects: projects.filter((p) => p.status === 'COMPLETED')
//           .length,

//         blockedProjects: projects.filter((p) => p.status === 'BLOCKED').length,

//         tasksInProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,

//         tasksCompleted: tasks.filter((t) => t.status === 'COMPLETED').length,

//         tasksLate: tasks.filter(
//           (t) =>
//             t.deadline &&
//             new Date(t.deadline) < new Date() &&
//             t.status !== 'COMPLETED',
//         ).length,

//         freelancersActive: freelancers.length,

//         revenueExpected,
//         revenueReceived,
//       },

//       projects: projects.slice(0, 5),

//       tasks: tasks.slice(0, 5),

//       activities,
//     };
//   }
// }
