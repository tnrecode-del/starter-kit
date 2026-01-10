import { db } from "../src/index.js";

async function main() {
  console.log("🌱 Starting seeding...");

  const user = await db.user.upsert({
    where: { email: "admin@starter.kit" },
    update: {},
    create: {
      email: "admin@starter.kit",
      name: "Admin User",
    },
  });

  console.log({ user });
  console.log("✅ Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
