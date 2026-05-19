// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.enableCors({
//     origin: ['http://localhost:3004'],
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//     allowedHeaders: 'Content-Type, Accept, Authorization',
//     credentials: true,
//   });

//   await app.listen(process.env.PORT ?? 3008);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  process.on('uncaughtException', (e) => console.error('uncaughtException', e));
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['https://gestionroyalsaleofficial.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  console.log('BOOT PORT=', process.env.PORT);
  await app.listen(Number(process.env.PORT) ?? 3000);
}
bootstrap();

// "build": "prisma generate --schema=prisma/schema.prisma && nest build && npm run copy:prisma && npm run copy:assets",
// "copy:prisma": "copyfiles -u 0 prisma/**/* dist/prisma/",
// "copy:assets": "copyfiles -u 1 src/templates/**/* dist/src/",
// "script": "{    "build": "nest build",
//     "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
//     "start": "node dist/src/main.js",
//     "start:dev": "nest start --watch",
//     "start:debug": "nest start --debug --watch",
//     "start:prod": "node dist/src/main.js",
//     "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
//     "test": "jest",
//     "test:watch": "jest --watch",
//     "test:cov": "jest --coverage",
//     "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
//     "test:e2e": "jest --config ./test/jest-e2e.json"
//   },"

// "scripts": {
//   "build": "prisma generate --schema=prisma/schema.prisma && nest build && npm run copy:prisma && npm run copy:assets",
//   "copy:prisma": "copyfiles -u 0 prisma/**/* dist/prisma/",
//   "copy:assets": "copyfiles -u 1 src/templates/**/* dist/src/",
//   "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
//   "start": "nest start",
//   "start:dev": "nest start --watch",
//   "start:debug": "nest start --debug --watch",
//   "start:prod": "node dist/main",
//   "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
//   "test": "jest",
//   "test:watch": "jest --watch",
//   "test:cov": "jest --coverage",
//   "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
//   "test:e2e": "jest --config ./test/jest-e2e.json"
// },

// "scripts": {
//   "start:debug": "nest start --debug --watch",

//   "postinstall": "prisma generate --schema=prisma/schema.prisma",

//   "prisma:init": "npx prisma init",

//   "build": "prisma generate --schema=prisma/schema.prisma && nest build && cp -R prisma dist/",

//   "migrate:prod": "prisma migrate deploy --schema=prisma/schema.prisma",

//   "start": "node dist/src/main.js",

//   "start:dev": "nest start --watch",

//   "start:prod": "npm run migrate:prod && node dist/src/main.js",

//   "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix"
// },
