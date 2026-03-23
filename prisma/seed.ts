import * as dotenv from 'dotenv';
import * as path from 'path';

const env = process.env.NODE_ENV || 'development';
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${env}`),
  override: true,
});
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PERMISSIONS = [
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'role:read',
  'role:create',
  'role:update',
  'role:delete',
];

async function main() {
  // 1. Seed permissions
  const permissions = await Promise.all(
    PERMISSIONS.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
  console.log(`Seeded ${permissions.length} permissions`);

  // 2. Seed roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });

  const petugasRole = await prisma.role.upsert({
    where: { name: 'PETUGAS' },
    update: {},
    create: { name: 'PETUGAS' },
  });

  const teamLeaderRole = await prisma.role.upsert({
    where: { name: 'TEAM_LEADER' },
    update: {},
    create: { name: 'TEAM_LEADER' },
  });

  const pengawasRole = await prisma.role.upsert({
    where: { name: 'PENGAWAS' },
    update: {},
    create: { name: 'PENGAWAS' },
  });
  console.log('Seeded roles: ADMIN, USER, PETUGAS, TEAM_LEADER, PENGAWAS');

  // 3. Assign permissions to roles
  // ADMIN gets all permissions
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // USER gets only user:read
  const userReadPerm = permissions.find((p) => p.name === 'user:read')!;
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: userRole.id,
        permissionId: userReadPerm.id,
      },
    },
    update: {},
    create: { roleId: userRole.id, permissionId: userReadPerm.id },
  });
  console.log('Assigned permissions to roles');

  // 4. Seed admin user + profile
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      roleId: adminRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      fullName: 'Admin',
    },
  });

  console.log('Seeded admin user:', admin.email);

  // 4b. Seed PETUGAS users + profiles
  const petugasUsers = [
    { email: 'petugas1@example.com', fullName: 'Budi Santoso', phone: '081234567001' },
    { email: 'petugas2@example.com', fullName: 'Andi Pratama', phone: '081234567002' },
    { email: 'petugas3@example.com', fullName: 'Siti Rahayu', phone: '081234567003' },
  ];

  const hashedPetugasPassword = await bcrypt.hash('petugas123', 10);

  for (const p of petugasUsers) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        password: hashedPetugasPassword,
        roleId: petugasRole.id,
        emailVerifiedAt: new Date(),
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: p.fullName,
        phone: p.phone,
      },
    });

    console.log('Seeded petugas user:', user.email);
  }

  // 4c. Seed TEAM_LEADER user + profile
  const hashedLeaderPassword = await bcrypt.hash('leader123', 10);

  const leader = await prisma.user.upsert({
    where: { email: 'leader@example.com' },
    update: {},
    create: {
      email: 'leader@example.com',
      password: hashedLeaderPassword,
      roleId: teamLeaderRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.profile.upsert({
    where: { userId: leader.id },
    update: {},
    create: {
      userId: leader.id,
      fullName: 'Rudi Hermawan',
      phone: '081234567010',
    },
  });

  console.log('Seeded team leader user:', leader.email);

  // 4d. Seed PENGAWAS user + profile
  const hashedPengawasPassword = await bcrypt.hash('pengawas123', 10);

  const pengawas = await prisma.user.upsert({
    where: { email: 'pengawas@example.com' },
    update: {},
    create: {
      email: 'pengawas@example.com',
      password: hashedPengawasPassword,
      roleId: pengawasRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.profile.upsert({
    where: { userId: pengawas.id },
    update: {},
    create: {
      userId: pengawas.id,
      fullName: 'Hendra Wijaya',
      phone: '081234567020',
    },
  });

  console.log('Seeded pengawas user:', pengawas.email);

  // 5. Seed default operational hours (Mon-Fri 07:00-17:00)
  const days = [
    { dayOfWeek: 0, startTime: '07:00', endTime: '17:00', isActive: false }, // Minggu
    { dayOfWeek: 1, startTime: '07:00', endTime: '17:00', isActive: true },  // Senin
    { dayOfWeek: 2, startTime: '07:00', endTime: '17:00', isActive: true },  // Selasa
    { dayOfWeek: 3, startTime: '07:00', endTime: '17:00', isActive: true },  // Rabu
    { dayOfWeek: 4, startTime: '07:00', endTime: '17:00', isActive: true },  // Kamis
    { dayOfWeek: 5, startTime: '07:00', endTime: '17:00', isActive: true },  // Jumat
    { dayOfWeek: 6, startTime: '07:00', endTime: '17:00', isActive: false }, // Sabtu
  ];

  for (const day of days) {
    await prisma.operationalHour.upsert({
      where: { dayOfWeek: day.dayOfWeek },
      update: {},
      create: day,
    });
  }
  console.log('Seeded operational hours (Mon-Fri active)');

  // 6. Seed divisions
  const divisions = [
    { name: 'Alat Berat', description: 'Divisi pengelola alat-alat berat' },
    { name: 'Konstruksi Drainase', description: 'Divisi pembangunan dan konstruksi drainase' },
    { name: 'Drainase', description: 'Divisi pemeliharaan drainase' },
    { name: 'Penjaga Sungai', description: 'Divisi pengawasan dan penjagaan sungai' },
    { name: 'Kolam', description: 'Divisi pengelolaan kolam retensi' },
    { name: 'Buset (Buang Setempat)', description: 'Divisi pengelolaan buang setempat' },
    { name: 'Trasbum', description: 'Divisi Trasbum' },
    { name: 'Bentor', description: 'Divisi petugas bentor' },
  ];

  for (const div of divisions) {
    await prisma.division.upsert({
      where: { name: div.name },
      update: {},
      create: div,
    });
  }
  console.log('Seeded divisions');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
