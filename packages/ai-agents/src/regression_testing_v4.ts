/**
 * Regression Testing v4 — Real Visual + Performance
 *
 * Fixes from v3:
 * - Real visual regression with pixelmatch (pixel-level diff)
 * - Baseline screenshot storage and comparison
 * - Proper Playwright API (newContext not createBrowserContext)
 * - Parallel test execution
 * - Web Vitals performance thresholds
 * - Structured test report with severity classification
 */

import { chromium, Browser, Page } from "playwright";
import fs from "fs/promises";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import pino from "pino";

import type {
  TestCase,
  TestStep,
  TestAssertion,
  RegressionResult,
} from "./types.js";

const log = pino({ name: "regression-testing" });

// ─── Baseline Directory ─────────────────────────────────────────────

const BASELINES_DIR = path.resolve(process.cwd(), ".regression-baselines");

// ─── Critical Path Tests ────────────────────────────────────────────

const CRITICAL_PATHS: TestCase[] = [
  {
    name: "User can login",
    critical: true,
    steps: [
      { action: "goto", value: "/login" },
      {
        action: "fill",
        selector: "input[name='email']",
        value: "test@example.com",
      },
      {
        action: "fill",
        selector: "input[name='password']",
        value: "TestPass123!",
      },
      { action: "click", selector: "button[type='submit']" },
      { action: "wait", selector: "[data-testid='dashboard']", timeout: 5000 },
    ],
    assertions: [
      { type: "visible", selector: "[data-testid='dashboard']" },
      {
        type: "contains",
        selector: "[data-testid='user-greeting']",
        value: "Welcome",
      },
      { type: "response_time", threshold: 2500 },
      { type: "visual_match", value: "login-success" },
    ],
  },
  {
    name: "User can create feature",
    critical: true,
    steps: [
      { action: "goto", value: "/dashboard" },
      { action: "click", selector: "button[data-testid='new-feature']" },
      {
        action: "fill",
        selector: "input[name='title']",
        value: "Test Feature",
      },
      {
        action: "fill",
        selector: "textarea[name='description']",
        value: "Feature description",
      },
      { action: "click", selector: "button[type='submit']" },
      {
        action: "wait",
        selector: "[data-testid='success-message']",
        timeout: 3000,
      },
    ],
    assertions: [
      {
        type: "contains",
        selector: "[data-testid='success-message']",
        value: "created",
      },
      { type: "response_time", threshold: 3000 },
    ],
  },
  {
    name: "API health check",
    critical: true,
    steps: [{ action: "goto", value: "/api/health" }],
    assertions: [
      { type: "contains", selector: "body", value: "ok" },
      { type: "response_time", threshold: 1000 },
    ],
  },
];

// ─── Regression Testing Engine ──────────────────────────────────────

export class RegressionTestingEngine {
  private baseUrl: string;
  private browser: Browser | null = null;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  /** Run all critical path tests */
  async runCriticalPathTests(): Promise<RegressionResult[]> {
    log.info("Starting critical path regression tests");

    await fs.mkdir(BASELINES_DIR, { recursive: true });

    this.browser = await chromium.launch({ headless: true });

    const criticalTests = CRITICAL_PATHS.filter((t) => t.critical);
    const results: RegressionResult[] = [];

    // Run tests in parallel (2 at a time to limit resources)
    const chunks = chunkArray(criticalTests, 2);
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((test) => this.runTest(test)),
      );
      results.push(...chunkResults);
    }

    await this.browser.close();
    this.browser = null;

    return results;
  }

  /** Run a single test case */
  private async runTest(testCase: TestCase): Promise<RegressionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let visualDiff: RegressionResult["visualDiff"];
    let performance: RegressionResult["performance"];

    const context = await this.browser!.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    try {
      // Execute steps
      for (const step of testCase.steps) {
        try {
          await this.executeStep(page, step);
        } catch (err) {
          errors.push(
            `Step ${step.action}(${step.selector ?? step.value}): ${(err as Error).message}`,
          );
        }
      }

      // Run assertions
      for (const assertion of testCase.assertions) {
        try {
          if (assertion.type === "visual_match") {
            visualDiff = await this.checkVisualRegression(
              page,
              assertion.value!,
            );
            if (visualDiff.detected) {
              errors.push(
                `Visual regression: ${visualDiff.diffPercent.toFixed(2)}% pixels differ (${visualDiff.severity})`,
              );
            }
          } else if (assertion.type === "response_time") {
            performance = await this.measurePerformance(page);
            if (performance.responseTime > (assertion.threshold ?? 3000)) {
              errors.push(
                `Slow response: ${performance.responseTime}ms > ${assertion.threshold}ms threshold`,
              );
            }
          } else {
            await this.runAssertion(page, assertion);
          }
        } catch (err) {
          errors.push(`Assertion ${assertion.type}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      errors.push(`Test error: ${(err as Error).message}`);
    } finally {
      await context.close();
    }

    const duration = Date.now() - startTime;
    const passed = errors.length === 0;

    const icon = passed ? "✅" : "❌";
    log.info(
      { test: testCase.name, passed, duration, errors: errors.length },
      `${icon} ${testCase.name}`,
    );

    return {
      testName: testCase.name,
      passed,
      duration,
      errors,
      visualDiff,
      performance,
    };
  }

  // ─── Step Execution ─────────────────────────────────────────────

  private async executeStep(page: Page, step: TestStep): Promise<void> {
    switch (step.action) {
      case "goto":
        await page.goto(`${this.baseUrl}${step.value}`, {
          waitUntil: "networkidle",
          timeout: 10_000,
        });
        break;
      case "click":
        await page.click(step.selector!, { timeout: step.timeout ?? 5000 });
        break;
      case "fill":
        await page.fill(step.selector!, step.value!, {
          timeout: step.timeout ?? 5000,
        });
        break;
      case "submit":
        await page.press(step.selector!, "Enter");
        break;
      case "wait":
        await page.waitForSelector(step.selector!, {
          timeout: step.timeout ?? 5000,
        });
        break;
      case "screenshot":
        await page.screenshot({
          path: step.value ?? "screenshot.png",
          fullPage: true,
        });
        break;
    }
  }

  // ─── Assertions ─────────────────────────────────────────────────

  private async runAssertion(
    page: Page,
    assertion: TestAssertion,
  ): Promise<void> {
    switch (assertion.type) {
      case "visible": {
        const visible = await page.isVisible(assertion.selector!);
        if (!visible)
          throw new Error(`Element ${assertion.selector} not visible`);
        break;
      }
      case "contains": {
        const text = await page.textContent(assertion.selector!);
        if (!text?.includes(assertion.value!)) {
          throw new Error(
            `"${assertion.selector}" does not contain "${assertion.value}"`,
          );
        }
        break;
      }
      case "attribute": {
        const el = await page.$(assertion.selector!);
        if (!el) throw new Error(`Element ${assertion.selector} not found`);
        break;
      }
    }
  }

  // ─── Visual Regression (Real pixelmatch) ────────────────────────

  private async checkVisualRegression(
    page: Page,
    baselineName: string,
  ): Promise<NonNullable<RegressionResult["visualDiff"]>> {
    const currentScreenshot = await page.screenshot({ fullPage: false });
    const baselinePath = path.join(BASELINES_DIR, `${baselineName}.png`);

    // Check if baseline exists
    try {
      await fs.access(baselinePath);
    } catch {
      // No baseline — save current as baseline, no regression
      await fs.writeFile(baselinePath, currentScreenshot);
      log.info({ baselineName }, "New baseline saved (first run)");
      return { detected: false, diffPercent: 0, severity: "low" };
    }

    // Compare against baseline
    const baselineBuffer = await fs.readFile(baselinePath);
    const baseline = PNG.sync.read(baselineBuffer);
    const current = PNG.sync.read(currentScreenshot);

    // Handle size mismatch
    if (
      baseline.width !== current.width ||
      baseline.height !== current.height
    ) {
      return { detected: true, diffPercent: 100, severity: "high" };
    }

    const diff = new PNG({ width: baseline.width, height: baseline.height });
    const mismatchedPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      baseline.width,
      baseline.height,
      { threshold: 0.1 },
    );

    const totalPixels = baseline.width * baseline.height;
    const diffPercent = (mismatchedPixels / totalPixels) * 100;

    // Save diff image for inspection
    if (diffPercent > 0.5) {
      const diffPath = path.join(BASELINES_DIR, `${baselineName}-diff.png`);
      await fs.writeFile(diffPath, PNG.sync.write(diff));
    }

    const severity =
      diffPercent > 5 ? "high" : diffPercent > 1 ? "medium" : "low";

    return { detected: diffPercent > 0.5, diffPercent, severity };
  }

  // ─── Performance Measurement ────────────────────────────────────

  private async measurePerformance(
    page: Page,
  ): Promise<NonNullable<RegressionResult["performance"]>> {
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (!nav) return { responseTime: 0, renderTime: 0 };

      return {
        responseTime: Math.round(nav.responseEnd - nav.requestStart),
        renderTime: Math.round(nav.domContentLoadedEventEnd - nav.responseEnd),
      };
    });

    return metrics;
  }

  // ─── Rollback Decision ──────────────────────────────────────────

  shouldRollback(results: RegressionResult[]): boolean {
    const hasCriticalFailure = results.some((r) => !r.passed);
    const hasHighVisualRegression = results.some(
      (r) => r.visualDiff?.severity === "high",
    );
    const hasPerformanceRegression = results.some(
      (r) => r.performance && r.performance.responseTime > 3000,
    );

    return (
      hasCriticalFailure || hasHighVisualRegression || hasPerformanceRegression
    );
  }

  // ─── Report Generation ──────────────────────────────────────────

  generateReport(results: RegressionResult[]): string {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const totalTime = results.reduce((s, r) => s + r.duration, 0);

    const lines: string[] = [
      "╔══════════════════════════════════════════╗",
      "║     REGRESSION TEST REPORT v4            ║",
      "╚══════════════════════════════════════════╝",
      "",
      `  ✅ Passed: ${passed}/${results.length}`,
      `  ❌ Failed: ${failed}/${results.length}`,
      `  ⏱️  Time: ${totalTime}ms`,
      "",
    ];

    for (const r of results) {
      const icon = r.passed ? "✅" : "❌";
      lines.push(`${icon} ${r.testName} (${r.duration}ms)`);
      if (r.errors.length > 0) {
        for (const e of r.errors) lines.push(`   └─ ${e}`);
      }
      if (r.visualDiff?.detected) {
        lines.push(
          `   └─ Visual diff: ${r.visualDiff.diffPercent.toFixed(2)}% (${r.visualDiff.severity})`,
        );
      }
      if (r.performance) {
        lines.push(
          `   └─ Response: ${r.performance.responseTime}ms | Render: ${r.performance.renderTime}ms`,
        );
      }
    }

    lines.push("");
    lines.push(
      this.shouldRollback(results)
        ? "🚨 CRITICAL FAILURES — ROLLBACK RECOMMENDED"
        : "✅ All critical paths passed",
    );

    return lines.join("\n");
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const engine = new RegressionTestingEngine(
    process.env.BASE_URL ?? "http://localhost:3000",
  );
  const results = await engine.runCriticalPathTests();
  console.log("\n" + engine.generateReport(results));

  if (engine.shouldRollback(results)) {
    console.error("\n🚨 ROLLBACK RECOMMENDED");
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  log.error({ err }, "Test runner error");
  process.exit(1);
});

export { CRITICAL_PATHS };
