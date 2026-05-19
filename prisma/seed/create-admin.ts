import * as bcrypt from 'bcrypt';
import { UserRole, PrismaClient } from '../../generated/prisma/client';
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function getDbConfigFromUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is not set');

  const u = new URL(raw);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  };
}

const adapter = new PrismaMariaDb({
  ...getDbConfigFromUrl(),
  connectionLimit: 5,
});

export const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Royal Sale',
      email: 'azariaceo@gmail.com',
      phone: '2290161157467',
      password,
      role: UserRole.ADMIN,
    },
  });

  console.log('Admin créé :', admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

// import 'dotenv/config';
// import * as bcrypt from 'bcrypt';
// import { PrismaClient, UserRole } from '../../generated/prisma/client';

// export const prisma = new PrismaClient();

// async function main() {
//   const adminEmail = 'azariaceo@gmail.com';

//   const existingAdmin = await prisma.user.findUnique({
//     where: { email: adminEmail },
//   });

//   if (existingAdmin) {
//     console.log('Admin already exists');
//     return;
//   }

//   const password = await bcrypt.hash('admin123', 10);

//   await prisma.user.create({
//     data: {
//       name: 'Super Admin',
//       email: adminEmail,
//       password,
//       role: UserRole.ADMIN,
//       active: true,
//     },
//   });

//   console.log('Admin created successfully');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

// import 'dotenv/config';
// import { PrismaPg } from '@prisma/adapter-pg';
// import * as bcrypt from 'bcrypt';
// import { PrismaClient, UserRole } from '../../generated/prisma/client';

// const adapter = new PrismaPg({
//   connectionString: process.env.DATABASE_URL,
// });

// export const prisma = new PrismaClient({ adapter });

// async function main() {
//   const adminEmail = 'azariaceo@gmail.com';

//   const existingAdmin = await prisma.user.findUnique({
//     where: { email: adminEmail },
//   });

//   if (existingAdmin) {
//     console.log('Admin already exists');
//     return;
//   }

//   const password = await bcrypt.hash('admin123', 10);

//   await prisma.user.create({
//     data: {
//       name: 'Super Admin',
//       email: adminEmail,
//       password: password,
//       role: UserRole.ADMIN,
//       active: true,
//     },
//   });

//   console.log('Admin created successfully');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

//   import * as bcrypt from 'bcrypt';
// import { UserRole, PrismaClient } from '../../generated/prisma/client';
// import 'dotenv/config';
// import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// function getDbConfigFromUrl() {
//  const raw = process.env.DATABASE_URL;
//  if (!raw) throw new Error('DATABASE_URL is not set');

//  const u = new URL(raw);
//  return {
//  host: u.hostname,
//  port: u.port ? Number(u.port) : 3306,
//  user: decodeURIComponent(u.username),
//  password: decodeURIComponent(u.password),
//  database: u.pathname.replace(/^\//, ''),
//  };
// }

// const adapter = new PrismaMariaDb({
//  ...getDbConfigFromUrl(),
//  connectionLimit: 5,
// });

// export const prisma = new PrismaClient({ adapter });

// async function main() {
//  const password = await bcrypt.hash('Telma15$.', 10);

//  const admin = await prisma.admin.create({
//  data: {
//  name: 'Elegance Mia',
//  email: 'elegancemia11@gmail.com',
//  phone: '2290161584504',
//  password,
//  role: UserRole.super_admin,
//  },
//  });

//  console.log('Admin créé :', admin);
// }

// main()
//  .catch(console.error)
//  .finally(() => prisma.$disconnect());

// ALTER TABLE users
// ADD CONSTRAINT unique_email UNIQUE ( email );

// ALTER TABLE freelancer
// ADD CONSTRAINT unique_userId UNIQUE ( userId );
