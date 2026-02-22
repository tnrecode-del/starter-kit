import { db } from "../src/index.js";

async function main() {
  const feature = await db.featureQueue.upsert({
    where: { featureId: 1 },
    update: {
      status: "PENDING",
      name: "Hello World API Endpoint",
      category: "backend",
      dependsOnIds: [],
      testSteps: "1. Endpoint returns 200\n2. Body contains 'Hello World'",
    },
    create: {
      featureId: 1,
      name: "Hello World API Endpoint",
      category: "backend",
      status: "PENDING",
      dependsOnIds: [],
      testSteps: "1. Endpoint returns 200\n2. Body contains 'Hello World'",
    },
  });

  console.log("Seeded FeatureQueue:", feature);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
