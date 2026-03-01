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

  // Define mock data for executionMetric and roiMetric
  const executionMetric = {
    totalCostUsd: 1.25,
    durationSeconds: 145,
    successRate: 98,
    readyForProduction: true,
    promptTokens: 4500,
    completionTokens: 2100,
    cachedTokens: 1000,
    agentsUsed: [
      { role: "Developer Agent", cost: 0.8 },
      { role: "Reviewer Agent", cost: 0.3 },
      { role: "Testing Agent", cost: 0.15 },
    ],
  };

  const roiMetric = {
    filesModified: 4,
    gitBranch: "feat/dashboard-analytics",
    toolsCalled: 12,
    estimatedHumanHoursSaved: 6.5,
    savedHumanHours: 6.4,
    roiRatio: 4.8,
  };

  const codeMetric = {
    filesCreated: 2,
    filesDeleted: 0,
    linesAdded: 154,
    linesRemoved: 12,
    testCoverageBefore: 78.5,
    testCoverageAfter: 81.2,
    typeErrorsBefore: 0,
    typeErrorsAfter: 0,
    lintErrorsBefore: 1,
    lintErrorsAfter: 0,
    securityFlags: [],
    architectApproved: true,
  };

  for (const f of feats) {
    await db.featureQueue.upsert({
      where: { featureId: f.featureId },
      update: {
        status: "COMPLETED",
        resultData:
          "### Developer Agent\n\n```tsx\nexport function AnalyticsChart() { ... }\n```",
        executionMetric: {
          upsert: {
            create: executionMetric,
            update: executionMetric,
          },
        },
        roiMetric: {
          upsert: {
            create: roiMetric,
            update: roiMetric,
          },
        },
        codeMetric: {
          upsert: {
            create: codeMetric,
            update: codeMetric,
          },
        },
        ...f,
      },
      create: {
        status: "COMPLETED",
        dependsOnIds: [],
        resultData:
          "### Developer Agent\n\n```tsx\nexport function AnalyticsChart() { ... }\n```",
        executionMetric: { create: executionMetric },
        roiMetric: { create: roiMetric },
        codeMetric: { create: codeMetric },
        ...f,
      },
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
