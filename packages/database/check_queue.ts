import { db } from "./src/index.js";

async function main() {
  const queue = await db.featureQueue.groupBy({
    by: ["status"],
    _count: {
      status: true,
    },
  });
  console.log(queue);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
