import { db } from "../src/index.js";

async function main() {
  const user = await db.user.upsert({
    where: { email: "admin@starter.kit" },
    update: {},
    create: {
      email: "admin@starter.kit",
      name: "Admin User",
    },
  });

  console.log({ user });
  console.log("✅ Админ создан");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
