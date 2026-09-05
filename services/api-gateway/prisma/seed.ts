import { PrismaClient, AttendanceStatus } from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // HRD Admin
  await prisma.employee.upsert({
    where: { email: 'hrd@dexa.com' },
    update: {},
    create: {
      name: 'HRD Admin',
      email: 'hrd@dexa.com',
      password: passwordHash,
      position: 'HR Manager',
      phone: '081200000000',
      role: 'ADMIN',
    },
  });

  // Employees
  const employees = [
    {
      name: 'Budi Santoso',
      email: 'budi@dexa.com',
      position: 'Frontend Engineer',
      phone: '081234567890',
    },
    {
      name: 'Siti Rahma',
      email: 'siti@dexa.com',
      position: 'Backend Engineer',
      phone: '081298765432',
    },
    {
      name: 'Andi Wijaya',
      email: 'andi@dexa.com',
      position: 'QA Engineer',
      phone: '081211112222',
    },
    { name: 'Dewi Lestari', email: 'dewi@dexa.com', position: 'UI/UX Designer', phone: '081300000001' },
    { name: 'Rizki Pratama', email: 'rizki@dexa.com', position: 'Backend Engineer', phone: '081300000002' },
    { name: 'Putri Ayu', email: 'putri@dexa.com', position: 'Product Manager', phone: '081300000003' },
    { name: 'Fajar Nugroho', email: 'fajar@dexa.com', position: 'DevOps Engineer', phone: '081300000004' },
    { name: 'Maya Sari', email: 'maya@dexa.com', position: 'Data Analyst', phone: '081300000005' },
    { name: 'Agus Salim', email: 'agus@dexa.com', position: 'Frontend Engineer', phone: '081300000006' },
    { name: 'Nina Kartika', email: 'nina@dexa.com', position: 'QA Engineer', phone: '081300000007' },
    { name: 'Bagus Prasetyo', email: 'bagus@dexa.com', position: 'Mobile Engineer', phone: '081300000008' },
    { name: 'Lia Anggraini', email: 'lia@dexa.com', position: 'HR Specialist', phone: '081300000009' },
    { name: 'Yoga Mahendra', email: 'yoga@dexa.com', position: 'Backend Engineer', phone: '081300000010' },
    { name: 'Sinta Dewanti', email: 'sinta@dexa.com', position: 'UI/UX Designer', phone: '081300000011' },
    { name: 'Hendra Gunawan', email: 'hendra@dexa.com', position: 'DevOps Engineer', phone: '081300000012' },
    { name: 'Ratna Wulandari', email: 'ratna@dexa.com', position: 'Data Scientist', phone: '081300000013' },
    { name: 'Doni Kusuma', email: 'doni@dexa.com', position: 'Frontend Engineer', phone: '081300000014' },
    { name: 'Vina Melati', email: 'vina@dexa.com', position: 'Product Designer', phone: '081300000015' },
    { name: 'Eko Prabowo', email: 'eko@dexa.com', position: 'Backend Engineer', phone: '081300000016' },
    { name: 'Tari Puspita', email: 'tari@dexa.com', position: 'QA Engineer', phone: '081300000017' },
    { name: 'Galih Saputra', email: 'galih@dexa.com', position: 'Mobile Engineer', phone: '081300000018' },
  ];

  const created = [];
  for (const e of employees) {
    const emp = await prisma.employee.upsert({
      where: { email: e.email },
      update: {},
      create: {
        ...e,
        password: passwordHash,
        role: 'EMPLOYEE',
      },
    });
    created.push(emp);
  }

  // Seed 30 working days of attendance for the demo employee (Budi) so the
  // summary pagination has data to page through. Today is left empty so live
  // check-in / check-out still works; the other employees stay clean.
  const WORKDAYS = 30;
  const budi = created[0];
  await prisma.attendance.deleteMany({ where: { employeeId: budi.id } });

  const now = new Date();
  let seeded = 0;
  let offset = 1; // start from yesterday
  while (seeded < WORKDAYS) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    offset += 1;

    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue; // skip weekends

    const checkIn = new Date(day);
    checkIn.setHours(8, 0, 0, 0);
    const checkOut = new Date(day);
    checkOut.setHours(17, 0, 0, 0);

    await prisma.attendance.createMany({
      data: [
        { employeeId: budi.id, status: AttendanceStatus.IN, timestamp: checkIn, date: ymd(day) },
        { employeeId: budi.id, status: AttendanceStatus.OUT, timestamp: checkOut, date: ymd(day) },
      ],
    });
    seeded += 1;
  }

  console.log('Seed complete.');
  console.log('   Admin login : hrd@dexa.com / password123');
  console.log('   Employee    : budi@dexa.com / password123');
  console.log(`   Total employees: ${created.length + 1}`);
  console.log(`   Attendance   : ${WORKDAYS} working days seeded for budi@dexa.com (today left empty)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
