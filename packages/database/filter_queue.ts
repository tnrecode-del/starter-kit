import { db } from "./src/index.js";

async function main() {
  const statusFilter = process.argv[2] || process.env.STATUS;
  const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"];

  if (!statusFilter || !statuses.includes(statusFilter.toUpperCase())) {
    console.log(
      `Please provide a valid status filter. Valid options are: ${statuses.join(", ")}`,
    );
    console.log(`Usage: pnpm tsx filter_queue.ts <STATUS>`);
    process.exit(1);
  }

  const tasks = await db.featureQueue.findMany({
    where: { status: statusFilter.toUpperCase() },
    select: { featureId: true, name: true, status: true, updatedAt: true },
  });

  console.log(
    `Found ${tasks.length} tasks with status: ${statusFilter.toUpperCase()}`,
  );
  console.log(tasks);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
