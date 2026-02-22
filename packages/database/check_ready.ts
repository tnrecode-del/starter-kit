import { db } from "./src/index.js";

async function main() {
  const readyTasks = await db.featureQueue.findMany({
    where: { status: "PENDING" },
  });

  const reallyReady = [];
  for (const task of readyTasks) {
    let isReady = true;
    if (task.dependsOnIds && task.dependsOnIds.length > 0) {
      const dependencies = await db.featureQueue.findMany({
        where: { featureId: { in: task.dependsOnIds } },
        select: { status: true },
      });
      isReady = dependencies.every((dep) => dep.status === "COMPLETED");
    }
    if (isReady) {
      reallyReady.push(task.featureId);
    }
  }

  console.log("Ready PENDING tasks:", reallyReady);

  const stuck = await db.featureQueue.findMany({
    where: { status: { in: ["IN_PROGRESS", "FAILED"] } },
    select: { featureId: true, status: true },
  });
  console.log("Stuck tasks:", stuck);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
