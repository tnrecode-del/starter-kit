import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { db } from "@core/database";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

interface FeatureTask {
  featureId: number;
  name: string;
  category: "functional" | "style";
  dependsOnIds: number[];
  testSteps: string;
}

const INITIALIZER_PROMPT = `
You are the INITIALIZER AGENT for a new software project.
Your job is to read the Project Specification (app_spec) and create a strict array of atomic Features. Generate as many features as necessary to cover the entire specification completely (typically 50-100+ for a real app).

CRITICAL RULES:
1. You must return an exhaustive list of features covering all functionalities.
2. The Output MUST be valid JSON (Array of Objects). 
3. The array order determines the assigned featureId (starting from 0).
4. Features 0-4 MUST be Infrastructure features with NO dependencies (dependsOnIds: []).
   - 0: Database connection established
   - 1: Database schema applied correctly
   - 2: Data persists across server restart
   - 3: No mock data patterns in codebase
   - 4: Backend API queries real database
5. All features from index 5 onwards MUST depend on [0, 1, 2, 3, 4].
6. Create WIDE graphs for parallelization, NOT linear chains. (e.g. multiple distinct features depending on [0,1,2,3,4, 5 (login)]).
7. MOCK DATA PROHIBITION: Actively forbid mock data in your testSteps.

JSON Schema:
Array of objects containing:
- featureId (number): 0, 1, 2, ... N
- name (string): The title of the feature
- category ("functional" | "style"): The type of task
- dependsOnIds (number[]): Array of featureIds this task depends on
- testSteps (string): Describe the QA steps

Analyze the following Project Specification:
---
`;

export async function runInitializer(appSpecRaw: string) {
  console.log("🚀 Starting Initializer Agent...");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: INITIALIZER_PROMPT,
  });

  console.log("Generating Feature Queue from app spec...");

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: appSpecRaw }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      responseSchema: {
        type: SchemaType.ARRAY,
        description: "Exhaustive array of all features",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            featureId: { type: SchemaType.INTEGER },
            name: { type: SchemaType.STRING },
            category: { type: SchemaType.STRING },
            dependsOnIds: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.INTEGER },
            },
            testSteps: { type: SchemaType.STRING },
          },
          required: [
            "featureId",
            "name",
            "category",
            "dependsOnIds",
            "testSteps",
          ],
        },
      },
    },
  });

  const text = response.response.text();

  let features: FeatureTask[];
  try {
    features = JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse JSON response from Gemini:", error);
    process.exit(1);
  }

  console.log(
    "Parsed " + features.length + " features. Saving to Prisma Database...",
  );

  let savedCount = 0;
  for (const feature of features) {
    try {
      await db.featureQueue.upsert({
        where: { featureId: feature.featureId },
        update: {
          name: feature.name,
          category: feature.category,
          dependsOnIds: feature.dependsOnIds,
          testSteps: feature.testSteps,
          status: "PENDING",
        },
        create: {
          featureId: feature.featureId,
          name: feature.name,
          category: feature.category,
          dependsOnIds: feature.dependsOnIds,
          testSteps: feature.testSteps,
          status: "PENDING",
        },
      });
      savedCount++;
    } catch (e) {
      console.error("Failed to save feature " + feature.featureId + ":", e);
    }
  }

  console.log(
    "✅ Initializer Agent finished. Saved " +
      savedCount +
      " features to the FeatureQueue.",
  );
  console.log(
    "Worker Agents can now poll the FeatureQueue for parallel execution.",
  );
}

// Allow running from CLI directly
import fs from "fs";

if (process.argv[1] && process.argv[1].endsWith("initializer_agent.ts")) {
  const specPath = fs.existsSync(
    path.resolve(process.cwd(), "../../app_spec.txt"),
  )
    ? path.resolve(process.cwd(), "../../app_spec.txt")
    : path.resolve(
        process.cwd(),
        "../../docs/gpt/v5_cognitive_agent_platform_report.md",
      );
  let specText = "";

  try {
    specText = fs.readFileSync(specPath, "utf-8");
  } catch (err) {
    console.error("Could not read spec file at: " + specPath);
    process.exit(1);
  }

  runInitializer(specText)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
