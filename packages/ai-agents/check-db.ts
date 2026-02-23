import { db } from "@core/database";
async function run() {
  const tasks = await db.featureQueue.findMany({
    select: { id: true, featureId: true, name: true, status: true },
  });
  console.log(JSON.stringify(tasks, null, 2));
}
run();
