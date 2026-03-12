#!/usr/bin/env node

import { Command } from "commander";
import { BrowserManager } from "../core/BrowserManager.js";
import { CoreWebVitalsCollector } from "../metrics/CoreWebVitals.js";
import { LighthouseAdapter } from "../audits/LighthouseAdapter.js";
import { ConsoleReporter } from "../reporters/ConsoleReporter.js";
import { JsonReporter } from "../reporters/JsonReporter.js";
import type { CLIOptions, TestResult, Config } from "../core/types.js";

let browserManager: BrowserManager | null = null;

async function cleanup(): Promise<void> {
  if (browserManager) {
    await browserManager.close();
    browserManager = null;
  }
}

process.on("SIGINT", async () => {
  console.log("\n\nReceived Ctrl+C, cleaning up...");
  await cleanup();
  process.exit(0);
});

process.on("SIGTSTP", async () => {
  console.log("\n\nReceived Ctrl+Z, cleaning up...");
  await cleanup();
  process.exit(0);
});

const program = new Command();

program
  .name("autoreview")
  .description("Frontend performance testing and analytics CLI")
  .version("2.0.0");

program
  .command("perf")
  .description("Run performance test on a URL")
  .argument("<url>", "URL to test")
  .option("-o, --output <path>", "Output file path (JSON)")
  .option("-i, --iterations <number>", "Number of test iterations", "1")
  .option("--no-headless", "Run in visible mode")
  .option("--devtools", "Open DevTools", false)
  .option("--verbose", "Verbose output", false)
  .action(async (url: string, options: CLIOptions) => {
    const reporter = new ConsoleReporter();
    const jsonReporter = new JsonReporter();
    const spinner = reporter.printSpinner("Running performance test...");

    try {
      const config: Partial<Config> = {
        browser: {
          headless: options.headless,
          devtools: options.devtools,
        },
        iterations: options.iterations
          ? parseInt(String(options.iterations), 10)
          : 1,
      };

      browserManager = new BrowserManager(config);
      await browserManager.launch();

      const page = browserManager.getPage()!;
      const cwvCollector = new CoreWebVitalsCollector(page);

      await cwvCollector.inject();

      await browserManager.navigate(url);

      await cwvCollector.waitForStable(5000);
      const cwv = await cwvCollector.collect();

      spinner();
      console.log("\n");

      const lighthouse = new LighthouseAdapter(browserManager.getBrowser()!);
      const lighthouseReport = await lighthouse.run(url);

      const result: TestResult = {
        url,
        timestamp: Date.now(),
        duration: 0,
        success: true,
        metrics: {
          coreWebVitals: cwv,
          lighthouse: lighthouseReport,
        },
      };

      if (options.output) {
        await jsonReporter.write(result, options.output);
        console.log(`Results written to ${options.output}\n`);
      }

      reporter.printResult(result);
    } catch (error) {
      spinner();
      reporter.printError(error as Error);
      await cleanup();
      process.exit(1);
    }

    await cleanup();
  });

program
  .command("cwv")
  .description("Measure Core Web Vitals")
  .argument("<url>", "URL to test")
  .option("-o, --output <path>", "Output file path (JSON)")
  .option("--no-headless", "Run in visible mode")
  .option("-v, --verbose", "Verbose output", false)
  .action(async (url: string, options: CLIOptions) => {
    const reporter = new ConsoleReporter();
    const jsonReporter = new JsonReporter();
    const spinner = reporter.printSpinner("Measuring Core Web Vitals...");

    try {
      browserManager = new BrowserManager({
        browser: { headless: options.headless },
      });
      await browserManager.launch();

      const page = browserManager.getPage()!;
      const cwvCollector = new CoreWebVitalsCollector(page);

      await cwvCollector.inject();

      await browserManager.navigate(url);

      await cwvCollector.waitForStable(5000);
      const cwv = await cwvCollector.collect();

      spinner();

      const result: TestResult = {
        url,
        timestamp: Date.now(),
        duration: 0,
        success: true,
        metrics: { coreWebVitals: cwv },
      };

      if (options.output) {
        await jsonReporter.write(result, options.output);
        console.log(`Results written to ${options.output}\n`);
      }

      reporter.printResult(result);
    } catch (error) {
      spinner();
      reporter.printError(error as Error);
      await cleanup();
      process.exit(1);
    }

    await cleanup();
  });

program.parse();
