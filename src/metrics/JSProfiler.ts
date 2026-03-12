import type { Page } from "puppeteer-core";

interface CPUProfile {
  startTime: number;
  endTime: number;
  samples: ProfileSample[];
}

interface ProfileSample {
  stack: string[];
  weight: number;
}

interface FunctionStats {
  name: string;
  selfTime: number;
  totalTime: number;
  callCount: number;
  url?: string;
  line?: number;
}

interface JSProfileResult {
  duration: number;
  topFunctions: FunctionStats[];
  slowScripts: SlowScript[];
  recommendations: string[];
}

interface SlowScript {
  url: string;
  line: number;
  duration: number;
  functionName: string;
}

export class JSProfiler {
  private page: Page;
  private cdpsession: unknown = null;

  constructor(page: Page) {
    this.page = page;
  }

  async startProfiling(): Promise<void> {
    this.cdpsession = await this.page.target().createCDPSession();
    await (this.cdpsession as { send: (cmd: string) => Promise<void> }).send(
      "Profiler.enable",
    );
    await (
      this.cdpsession as {
        send: (cmd: string, params?: unknown) => Promise<void>;
      }
    ).send("Profiler.start", {
      includeCounters: true,
      includeSampleInterval: true,
    });
  }

  async stopProfiling(): Promise<CPUProfile> {
    if (!this.cdpsession) {
      throw new Error("Profiler not started");
    }

    try {
      const session = this.cdpsession as {
        send: (cmd: string) => Promise<{ profile: unknown }>;
      };
      const result = await session.send("Profiler.stop");

      const profile = result.profile as {
        startTime: number;
        endTime: number;
        samples?: Array<{
          stack: Array<{
            functionName: string;
            url?: string;
            lineNumber?: number;
          }>;
        }>;
        timeDeltas?: number[];
      } | null;

      if (!profile) {
        return { startTime: 0, endTime: 0, samples: [] };
      }

      return {
        startTime: profile.startTime || 0,
        endTime: profile.endTime || 0,
        samples: this.parseProfile(profile),
      };
    } catch (e) {
      return { startTime: 0, endTime: 0, samples: [] };
    }
  }

  private parseProfile(profile: {
    samples?: Array<{
      stack: Array<{ functionName: string; url?: string; lineNumber?: number }>;
    }>;
    timeDeltas?: number[];
  }): ProfileSample[] {
    const samples: ProfileSample[] = [];

    if (!profile.samples) return samples;

    for (let i = 0; i < profile.samples.length; i++) {
      const sample = profile.samples[i];
      const stack = sample.stack.map((s) => s.functionName || "(anonymous)");
      const weight = profile.timeDeltas?.[i] || 1;

      samples.push({ stack, weight });
    }

    return samples;
  }

  async profilePage(durationSeconds: number = 10): Promise<JSProfileResult> {
    await this.startProfiling();

    await this.page.goto(this.page.url(), { waitUntil: "networkidle2" });

    await new Promise((resolve) => setTimeout(resolve, durationSeconds * 1000));

    const profile = await this.stopProfiling();

    return this.analyzeProfile(profile);
  }

  analyzeProfile(profile: CPUProfile): JSProfileResult {
    const functionMap = new Map<string, FunctionStats>();

    for (const sample of profile.samples) {
      if (sample.stack.length === 0) continue;

      const leaf = sample.stack[sample.stack.length - 1];
      const selfTime = sample.weight;

      if (!functionMap.has(leaf)) {
        functionMap.set(leaf, {
          name: leaf,
          selfTime: 0,
          totalTime: 0,
          callCount: 0,
        });
      }

      const stats = functionMap.get(leaf)!;
      stats.selfTime += selfTime;
      stats.callCount++;

      for (let i = 0; i < sample.stack.length - 1; i++) {
        const parent = sample.stack[i];
        if (!functionMap.has(parent)) {
          functionMap.set(parent, {
            name: parent,
            selfTime: 0,
            totalTime: 0,
            callCount: 0,
          });
        }
        functionMap.get(parent)!.totalTime += selfTime;
      }
    }

    const topFunctions = Array.from(functionMap.values())
      .sort((a, b) => b.selfTime - a.selfTime)
      .slice(0, 20);

    const slowScripts: SlowScript[] = [];
    const recommendations: string[] = [];

    const totalTime = profile.endTime - profile.startTime;
    const slowFunctions = topFunctions.filter(
      (f) => f.selfTime > totalTime * 0.1,
    );

    if (slowFunctions.length > 0) {
      recommendations.push(
        `Found ${slowFunctions.length} functions taking >10% of total time`,
        "Consider: 1) Caching computed values 2) Lazy loading 3) Web Workers for heavy computation",
      );
    }

    const heavyFunctions = topFunctions.filter((f) => f.callCount > 1000);
    if (heavyFunctions.length > 0) {
      recommendations.push(
        `${heavyFunctions[0].name} called ${heavyFunctions[0].callCount} times - consider memoization`,
      );
    }

    return {
      duration: totalTime,
      topFunctions,
      slowScripts,
      recommendations,
    };
  }

  async getPageTiming(): Promise<Record<string, number>> {
    const timing = await this.page.evaluate(() => {
      const entries = (
        performance as unknown as {
          getEntriesByType: (type: string) => Array<{
            name: string;
            startTime: number;
            responseStart?: number;
            domContentLoadedEventEnd?: number;
            loadEventEnd?: number;
            domInteractive?: number;
          }>;
        }
      ).getEntriesByType("navigation");
      const nav = entries[0];

      return {
        domContentLoaded:
          (nav?.domContentLoadedEventEnd || 0) - (nav?.responseStart || 0),
        loadComplete: (nav?.loadEventEnd || 0) - (nav?.responseStart || 0),
        firstPaint: 0,
        domInteractive: (nav?.domInteractive || 0) - (nav?.responseStart || 0),
      };
    });

    return timing;
  }
}
