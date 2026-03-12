import type { Page } from "puppeteer-core";

interface HeapSnapshot {
  snapshotId: string;
  timestamp: number;
  nodes: number;
  size: number;
}

interface MemoryLeakResult {
  detected: boolean;
  severity: "none" | "minor" | "moderate" | "severe";
  snapshots: HeapSnapshot[];
  growth: {
    nodeGrowth: number;
    sizeGrowth: number;
    sizeGrowthMB: number;
  };
  topDetached: DetachedElement[];
  recommendations: string[];
}

interface DetachedElement {
  type: string;
  count: number;
  size: number;
  shallowSize: number;
}

export class MemoryProfiler {
  private page: Page;
  private snapshots: HeapSnapshot[] = [];
  private cdpsession: unknown;

  constructor(page: Page) {
    this.page = page;
  }

  async startProfiling(): Promise<void> {
    this.cdpsession = await this.page.target().createCDPSession();
    await (this.cdpsession as { send: (cmd: string) => Promise<void> }).send(
      "HeapProfiler.enable",
    );
    this.snapshots = [];
  }

  async takeSnapshot(label: string = "snapshot"): Promise<HeapSnapshot> {
    const session = this.cdpsession as {
      send: (
        cmd: string,
        params?: unknown,
      ) => Promise<{ snapshot: { id: string } }>;
    };

    await session.send("HeapProfiler.takeHeapSnapshot", {
      reportProgress: false,
    });

    const metrics = await this.page.metrics();

    const snapshot: HeapSnapshot = {
      snapshotId: label,
      timestamp: Date.now(),
      nodes: 0,
      size: metrics.JSHeapUsedSize || 0,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  async takeInitialSnapshot(): Promise<HeapSnapshot> {
    return this.takeSnapshot("initial");
  }

  async takeFinalSnapshot(): Promise<HeapSnapshot> {
    return this.takeSnapshot("final");
  }

  async runScenario(
    scenario: () => Promise<void>,
    iterations: number = 5,
  ): Promise<MemoryLeakResult> {
    await this.startProfiling();

    await this.takeInitialSnapshot();

    for (let i = 0; i < iterations; i++) {
      await scenario();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await this.forceGC();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await this.takeFinalSnapshot();

    return this.analyzeLeaks();
  }

  private async forceGC(): Promise<void> {
    const session = this.cdpsession as { send: (cmd: string) => Promise<void> };
    await session.send("HeapProfiler.collectGarbage");
  }

  analyzeLeaks(): MemoryLeakResult {
    if (this.snapshots.length < 2) {
      return {
        detected: false,
        severity: "none",
        snapshots: this.snapshots,
        growth: { nodeGrowth: 0, sizeGrowth: 0, sizeGrowthMB: 0 },
        topDetached: [],
        recommendations: ["Need at least 2 snapshots to detect memory leaks"],
      };
    }

    const initial = this.snapshots[0];
    const final = this.snapshots[this.snapshots.length - 1];

    const sizeGrowth = final.size - initial.size;
    const sizeGrowthMB = sizeGrowth / 1024 / 1024;

    let severity: "none" | "minor" | "moderate" | "severe" = "none";
    let detected = false;

    if (sizeGrowthMB > 10) {
      severity = "severe";
      detected = true;
    } else if (sizeGrowthMB > 5) {
      severity = "moderate";
      detected = true;
    } else if (sizeGrowthMB > 1) {
      severity = "minor";
    }

    const recommendations: string[] = [];
    if (detected) {
      recommendations.push(
        `Memory grew by ${sizeGrowthMB.toFixed(2)}MB - possible memory leak detected`,
        "Check for: 1) Unclosed event listeners 2) DOM references in closures",
        "3) Timers not cleared (setInterval/setTimeout) 4) Circular references",
      );
    }

    if (sizeGrowthMB > 5) {
      recommendations.push("Consider using WeakMap/WeakSet for object caching");
      recommendations.push("Review large object allocations in hot code paths");
    }

    const topDetached: DetachedElement[] = [];

    return {
      detected,
      severity,
      snapshots: this.snapshots,
      growth: {
        nodeGrowth: 0,
        sizeGrowth,
        sizeGrowthMB,
      },
      topDetached,
      recommendations,
    };
  }

  async getHeapStats(): Promise<Record<string, number>> {
    const metrics = await this.page.metrics();
    return {
      jsHeapUsedSize: metrics.JSHeapUsedSize || 0,
      jsHeapTotalSize: metrics.JSHeapTotalSize || 0,
    };
  }

  async stopProfiling(): Promise<void> {
    if (this.cdpsession) {
      const session = this.cdpsession as {
        send: (cmd: string) => Promise<void>;
        detach: () => Promise<void>;
      };
      await session.send("HeapProfiler.disable");
      await session.detach();
      this.cdpsession = null;
    }
  }
}
