import { db } from "../src/index.js";

async function main() {
  const feats = [
    {
      featureId: 5,
      name: "Dashboard Analytics Charts Component",
      category: "frontend",
      priority: "HIGH",
      testSteps:
        "1. Render a responsive Recharts bar chart\n2. Integrate with mock data hooks\n3. Use Tailwind and Glassmorphism design",
    },
    {
      featureId: 6,
      name: "User Role Permission Middleware",
      category: "backend",
      priority: "LOW",
      testSteps:
        "1. Create NestJS Guard for Role checking\n2. Read JWT token and validate role\n3. Throw 403 Forbidden if not Admin",
    },
  ];

  for (const f of feats) {
    await db.featureQueue.upsert({
      where: { featureId: f.featureId },
      update: { status: "PENDING", ...f },
      create: { status: "PENDING", dependsOnIds: [], ...f },
    });
  }

  console.log("Seeded new complex tasks to FeatureQueue!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
