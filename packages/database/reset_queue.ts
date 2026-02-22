import { db } from "./src/index.js";

async function main() {
  const result = await db.featureQueue.updateMany({
    where: { status: { in: ["IN_PROGRESS", "FAILED"] } },
    data: { status: "PENDING" },
  });
  console.log("Reset tasks:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
