import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "../src/shared/prisma";

async function main() {
  console.log("Seeding demo users...");

  const hashedPassword = await bcrypt.hash("demo123", 10);

  const demoUsers = [
    {
      email: "superadmin@example.com",
      name: "Super Admin",
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isDeletable: false,
    },
    {
      email: "admin@example.com",
      name: "Admin User",
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isDeletable: false,
    },
    {
      email: "manager@example.com",
      name: "Manager User",
      password: hashedPassword,
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      isDeletable: false,
    },
    {
      email: "demoUser@example.com",
      name: "Demo User",
      password: hashedPassword,
      role: UserRole.DEMO_USER,
      status: UserStatus.ACTIVE,
      isDeletable: true,
    },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {}, // Don't update if already exists
      create: user,
    });
    console.log(`Upserted user: ${user.email}`);
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
