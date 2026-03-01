import { db } from "../src/index.js";

async function main() {
  console.log("Seeding fresh test feature...");

  // Clean all previous demo data
  await db.featureQueue.deleteMany();
  await db.executionMetric.deleteMany();
  await db.roiMetric.deleteMany();

  // Insert a test feature for Orchestrator to pick up
  const seedFeature = await db.featureQueue.create({
    data: {
      featureId: 1001,
      name: "[Integration Test] Create Greeting API Route",
      category: "backend",
      status: "DRAFT",
      testSteps: "Check that /api/hello returns 200 OK and valid JSON.",
    },
  });

  console.log(
    "Database seeded successfully with test feature: ",
    seedFeature.id,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
