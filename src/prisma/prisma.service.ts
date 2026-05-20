import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaMariaDb({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? '',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? '',
      connectionLimit: 10,
    });

    super({ adapter, log: ['error', 'warn'] });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaMariaDb } from '@prisma/adapter-mariadb';
// import { PrismaClient } from '../../generated/prisma/client';

// function getDbConfigFromUrl() {
//   const raw = process.env.DATABASE_URL;
//   if (!raw) throw new Error('DATABASE_URL is not set');

//   const u = new URL(raw);
//   return {
//     host: u.hostname,
//     port: u.port ? Number(u.port) : 3306,
//     user: decodeURIComponent(u.username),
//     password: decodeURIComponent(u.password),
//     database: u.pathname.replace(/^\//, ''),
//   };
// }

// @Injectable()
// export class PrismaService
//   extends PrismaClient
//   implements OnModuleInit, OnModuleDestroy
// {
//   constructor() {
//     const cfg = getDbConfigFromUrl();

//     const adapter = new PrismaMariaDb({
//       ...cfg,
//       connectionLimit: 5,
//     });

//     super({ adapter, log: ['query', 'info', 'warn', 'error'] });
//   }

//   async onModuleInit() {
//     await this.$connect();
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//   }
// }

// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { PrismaClient } from 'generated/prisma/client';

// @Injectable()
// export class PrismaService
//   extends PrismaClient
//   implements OnModuleInit, OnModuleDestroy
// {
//   constructor() {
//     const adapter = new PrismaPg({
//       connectionString: process.env.DATABASE_URL,
//     });

//     super({
//       adapter,
//       log: ['query', 'info', 'warn', 'error'],
//     });
//   }

//   async onModuleInit() {
//     await this.$connect();
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//   }
// }
