import { db } from "./src/index.js";

async function main() {
  const queue = await db.featureQueue.findMany();
  console.log(JSON.stringify(queue, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
