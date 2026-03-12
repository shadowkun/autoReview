#!/usr/bin/env node

import { Command } from "commander";
import { writeFile } from "fs/promises";
import { BrowserManager } from "../core/BrowserManager.js";
import { CoreWebVitalsCollector } from "../metrics/CoreWebVitals.js";
import { LighthouseAdapter } from "../audits/LighthouseAdapter.js";
import { ConsoleReporter } from "../reporters/ConsoleReporter.js";
import { JsonReporter } from "../reporters/JsonReporter.js";
import { analyzeTraceFile } from "../utils/TraceAnalyzer.js";
import { FPSMonitor } from "../metrics/FPSMonitor.js";
import { MemoryProfiler } from "../metrics/MemoryProfiler.js";
import { JSProfiler } from "../metrics/JSProfiler.js";
import type {
  CLIOptions,
  TestResult,
  Config,
  NetworkThrottlingPreset,
} from "../core/types.js";

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
  .option(
    "--network <preset>",
    "Network throttling (online, slow-2g, fast-2g, 3g, fast-3g, 4g, offline)",
  )
  .option("--cpu <rate>", "CPU throttling rate (1=normal, 4=4x slower)")
  .option("--viewport <WxH>", "Viewport size (e.g., 1920x1080)")
  .option("--mobile", "Emulate mobile device")
  .option(
    "--wait-until <event>",
    "Wait until event (load, domcontentloaded, networkidle0, networkidle2)",
    "networkidle2",
  )
  .option("--timeout <ms>", "Navigation timeout in ms", "30000")
  .action(async (url: string, options: CLIOptions) => {
    const reporter = new ConsoleReporter();
    const jsonReporter = new JsonReporter();
    const spinner = reporter.printSpinner("Running performance test...");

    try {
      const viewport = options.viewport
        ? parseViewport(options.viewport)
        : undefined;

      const config: Partial<Config> = {
        browser: {
          headless: options.headless,
          devtools: options.devtools,
          viewport:
            viewport ||
            (options.mobile
              ? { width: 375, height: 812, isMobile: true }
              : undefined),
        },
        navigation: {
          waitUntil: options.waitUntil as
            | "load"
            | "domcontentloaded"
            | "networkidle0"
            | "networkidle2",
          timeout: parseInt(String(options.timeout), 10),
        },
        iterations: options.iterations
          ? parseInt(String(options.iterations), 10)
          : 1,
      };

      browserManager = new BrowserManager(config);
      await browserManager.launch();
      await browserManager.newPage();

      if (options.network && options.network !== "online") {
        console.log(`\nApplying network throttling: ${options.network}`);
        await browserManager.setNetworkThrottling(
          options.network as NetworkThrottlingPreset,
        );
      }

      if (options.cpu && parseInt(String(options.cpu), 10) > 1) {
        console.log(`\nApplying CPU throttling: ${options.cpu}x`);
        await browserManager.setCPUThrottling(
          parseInt(String(options.cpu), 10),
        );
      }

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
  .option(
    "--network <preset>",
    "Network throttling (online, slow-2g, fast-2g, 3g, fast-3g, 4g, offline)",
  )
  .option("--cpu <rate>", "CPU throttling rate")
  .option("--viewport <WxH>", "Viewport size")
  .option("--mobile", "Emulate mobile device")
  .action(async (url: string, options: CLIOptions) => {
    const reporter = new ConsoleReporter();
    const jsonReporter = new JsonReporter();
    const spinner = reporter.printSpinner("Measuring Core Web Vitals...");

    try {
      const viewport = options.viewport
        ? parseViewport(options.viewport)
        : undefined;

      browserManager = new BrowserManager({
        browser: {
          headless: options.headless,
          viewport:
            viewport ||
            (options.mobile
              ? { width: 375, height: 812, isMobile: true }
              : undefined),
        },
      });
      await browserManager.launch();
      await browserManager.newPage();

      if (options.network && options.network !== "online") {
        await browserManager.setNetworkThrottling(
          options.network as NetworkThrottlingPreset,
        );
      }

      if (options.cpu && parseInt(String(options.cpu), 10) > 1) {
        await browserManager.setCPUThrottling(
          parseInt(String(options.cpu), 10),
        );
      }

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

program
  .command("trace")
  .description("Capture detailed trace data for Chrome DevTools")
  .argument("<url>", "URL to test")
  .option("-o, --output <path>", "Output trace file", "trace.json")
  .option("--no-headless", "Run in visible mode")
  .option("--duration <seconds>", "Recording duration", "10")
  .option("--network <preset>", "Network throttling")
  .option("--cpu <rate>", "CPU throttling rate")
  .action(async (url: string, options: CLIOptions) => {
    const reporter = new ConsoleReporter();

    try {
      browserManager = new BrowserManager({
        browser: { headless: options.headless },
      });
      await browserManager.launch();
      await browserManager.newPage();

      if (options.network && options.network !== "online") {
        await browserManager.setNetworkThrottling(
          options.network as NetworkThrottlingPreset,
        );
      }

      if (options.cpu && parseInt(String(options.cpu), 10) > 1) {
        await browserManager.setCPUThrottling(
          parseInt(String(options.cpu), 10),
        );
      }

      const page = browserManager.getPage()!;
      const client = await page.target().createCDPSession();

      const traceEvents: unknown[] = [];

      client.on("Tracing.dataCollected", (params: { value: unknown[] }) => {
        traceEvents.push(...params.value);
      });

      console.log("Starting trace recording...");
      await client.send("Tracing.start", {
        categories:
          "-*,devtools.timeline,blink.user_timing,latencyInfo,v8.execute,blink.console",
      });

      await page.goto(url, { waitUntil: "networkidle2" });

      const duration = parseInt(String(options.duration), 10) * 1000;
      await new Promise((resolve) => setTimeout(resolve, duration));

      console.log("Stopping trace...");
      await client.send("Tracing.end");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const traceData = {
        traceEvents: traceEvents,
        metadata: {
          url: url,
          timestamp: Date.now(),
          version: "1.0",
        },
      };

      const path = String(options.output);
      await writeFile(path, JSON.stringify(traceData, null, 2));

      console.log(`\n✓ Trace saved to ${path} (${traceEvents.length} events)`);
      console.log(
        "\nOpen Chrome DevTools → Performance tab → Load profile to view flame chart\n",
      );

      await client.detach();
    } catch (error) {
      reporter.printError(error as Error);
      await cleanup();
      process.exit(1);
    }

    await cleanup();
  });

program
  .command("analyze")
  .description("Analyze trace file and generate LLM-friendly report")
  .argument("<file>", "Path to trace JSON file")
  .option("-o, --output <path>", "Output file path")
  .action(async (file: string, options: CLIOptions) => {
    try {
      console.log(`Analyzing trace file: ${file}...`);
      const result = await analyzeTraceFile(file);

      console.log("\n" + "=".repeat(60));
      console.log(result.summary);
      console.log("=".repeat(60));

      if (options.output) {
        await writeFile(options.output, result.summary, "utf-8");
        console.log(`\nReport saved to ${options.output}`);
      }
    } catch (error) {
      console.error(`\n✖ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("check")
  .description("Comprehensive performance check (FPS + Memory + JS + CWV)")
  .argument("<url>", "URL to test")
  .option("-o, --output <path>", "Output file path (JSON)")
  .option("--no-headless", "Run in visible mode")
  .option("--duration <seconds>", "Monitoring duration", "10")
  .action(async (url: string, options: CLIOptions) => {
    const reporter = new ConsoleReporter();
    const spinner = reporter.printSpinner("Running comprehensive check...");

    try {
      browserManager = new BrowserManager({
        browser: { headless: options.headless },
      });
      await browserManager.launch();
      await browserManager.newPage();

      const page = browserManager.getPage()!;

      console.log("\n=== 1. Core Web Vitals ===");
      const cwvCollector = new CoreWebVitalsCollector(page);
      await cwvCollector.inject();
      await browserManager.navigate(url);
      await cwvCollector.waitForStable(5000);
      const cwv = await cwvCollector.collect();
      console.log(`LCP: ${cwv.lcp}ms, CLS: ${cwv.cls}, TTFB: ${cwv.ttfb}ms`);

      console.log("\n=== 2. FPS Monitoring ===");
      const fpsMonitor = new FPSMonitor(page);
      await fpsMonitor.inject();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const fps = await fpsMonitor.getFPS();
      console.log(`FPS: ${fps.fps}, Dropped: ${fps.droppedFrames} frames`);

      console.log("\n=== 3. Memory Analysis ===");
      const memProfiler = new MemoryProfiler(page);
      await memProfiler.startProfiling();
      await memProfiler.takeInitialSnapshot();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await memProfiler.takeFinalSnapshot();
      const memResult = await memProfiler.analyzeLeaks();
      const heapStats = await memProfiler.getHeapStats();
      console.log(
        `Heap Used: ${(heapStats.jsHeapUsedSize / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(
        `Leak Detected: ${memResult.detected} (${memResult.severity})`,
      );
      await memProfiler.stopProfiling();

      console.log("\n=== 4. JS Performance ===");
      const jsProfiler = new JSProfiler(page);
      await jsProfiler.startProfiling();
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const jsResult = await jsProfiler.stopProfiling();
      const analysis = jsProfiler.analyzeProfile(jsResult);
      console.log(`Top function: ${analysis.topFunctions[0]?.name || "N/A"}`);

      spinner();

      const result = {
        url,
        timestamp: Date.now(),
        coreWebVitals: cwv,
        fps,
        memory: { ...memResult, heapStats },
        jsPerformance: analysis,
      };

      console.log("\n" + "=".repeat(60));
      console.log("COMPREHENSIVE CHECK RESULTS");
      console.log("=".repeat(60));
      console.log(`URL: ${url}`);
      console.log(`\n📊 Core Web Vitals:`);
      console.log(`  LCP: ${cwv.lcp}ms ${(cwv.lcp || 0) < 2500 ? "✅" : "❌"}`);
      console.log(`  CLS: ${cwv.cls} ${(cwv.cls || 0) < 0.1 ? "✅" : "❌"}`);
      console.log(
        `  TTFB: ${cwv.ttfb}ms ${(cwv.ttfb || 0) < 800 ? "✅" : "❌"}`,
      );
      console.log(
        `\n🎬 FPS: ${fps.fps} ${fps.fps > 50 ? "✅" : "❌"} (${fps.droppedFrames} dropped)`,
      );
      console.log(
        `\n💾 Memory: ${memResult.severity === "none" ? "✅ OK" : "⚠️ " + memResult.severity}`,
      );
      console.log(`\n⚡ JS: ${analysis.topFunctions[0]?.name || "N/A"}`);
      console.log("=".repeat(60));

      if (options.output) {
        await writeFile(
          String(options.output),
          JSON.stringify(result, null, 2),
        );
        console.log(`\nResults saved to ${options.output}`);
      }
    } catch (error) {
      spinner();
      reporter.printError(error as Error);
      await cleanup();
      process.exit(1);
    }

    await cleanup();
  });

function parseViewport(
  str: string,
): { width: number; height: number } | undefined {
  const match = str.match(/^(\d+)x(\d+)$/i);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
  return undefined;
}

program.parse();
