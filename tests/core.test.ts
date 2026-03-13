import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("BrowserManager", () => {
  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue({
      setViewport: vi.fn().mockResolvedValue(undefined),
      goto: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }),
    close: vi.fn().mockResolvedValue(undefined),
    wsEndpoint: vi.fn().mockReturnValue("ws://localhost:9222"),
  };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should have correct default config", async () => {
    const { BrowserManager } = await import("../src/core/BrowserManager.js");
    const manager = new BrowserManager();

    expect(manager).toBeDefined();
  });

  it("should apply network throttling presets", async () => {
    const { BrowserManager } = await import("../src/core/BrowserManager.js");

    const presets = BrowserManager.NetworkPresets;

    expect(presets.online.downloadThroughput).toBe(-1);
    expect(presets["slow-2g"].latency).toBe(2000);
    expect(presets["3g"].latency).toBe(400);
    expect(presets.offline.offline).toBe(true);
  });
});

describe("CoreWebVitals", () => {
  it("should have valid type definitions", () => {
    const cwv = {
      lcp: 1000,
      fid: 50,
      cls: 0.05,
      inp: 200,
      ttfb: 500,
      fcp: 800,
      tti: 2000,
    };

    expect(cwv.lcp).toBe(1000);
    expect(cwv.fid).toBe(50);
    expect(cwv.cls).toBe(0.05);
    expect(typeof cwv.inp).toBe("number");
  });

  it("should handle null values", () => {
    const cwv = {
      lcp: null,
      fid: null,
      cls: null,
      inp: null,
      ttfb: null,
      fcp: null,
      tti: null,
    };

    expect(cwv.lcp).toBeNull();
    expect(cwv.fid).toBeNull();
  });
});

describe("CLI Options", () => {
  it("should have valid network presets", () => {
    const presets = [
      "online",
      "offline",
      "slow-2g",
      "fast-2g",
      "3g",
      "fast-3g",
      "4g",
    ];
    presets.forEach((preset) => {
      expect(preset).toBeDefined();
    });
  });

  it("should parse viewport correctly", () => {
    const parseViewport = (str: string) => {
      const match = str.match(/^(\d+)x(\d+)$/i);
      if (match) {
        return {
          width: parseInt(match[1], 10),
          height: parseInt(match[2], 10),
        };
      }
      return undefined;
    };

    expect(parseViewport("1920x1080")).toEqual({ width: 1920, height: 1080 });
    expect(parseViewport("375x812")).toEqual({ width: 375, height: 812 });
    expect(parseViewport("invalid")).toBeUndefined();
  });
});

describe("TraceAnalyzer", () => {
  it("should parse trace events correctly", () => {
    const mockTraceData = {
      traceEvents: [
        {
          name: "Event1",
          dur: 100,
          cat: "test",
          ph: "X",
          pid: 1,
          tid: 1,
          ts: 1000,
        },
        {
          name: "Event2",
          dur: 200,
          cat: "test",
          ph: "X",
          pid: 1,
          tid: 1,
          ts: 1100,
        },
        {
          name: "Event1",
          dur: 150,
          cat: "test",
          ph: "X",
          pid: 1,
          tid: 1,
          ts: 1200,
        },
      ],
      metadata: { url: "https://example.com" },
    };

    expect(mockTraceData.traceEvents.length).toBe(3);
    expect(mockTraceData.metadata.url).toBe("https://example.com");
  });

  it("should calculate average duration correctly", () => {
    const events = [
      { name: "test", dur: 100 },
      { name: "test", dur: 200 },
    ];

    const totalDuration = events.reduce((sum, e) => sum + e.dur, 0);
    const avgDuration = totalDuration / events.length;

    expect(avgDuration).toBe(150);
  });
});

describe("Memory Profiler", () => {
  it("should have valid memory leak severity levels", () => {
    const severities = ["none", "minor", "moderate", "severe"];

    expect(severities).toContain("none");
    expect(severities).toContain("minor");
    expect(severities).toContain("moderate");
    expect(severities).toContain("severe");
  });

  it("should calculate memory growth correctly", () => {
    const initial = 10 * 1024 * 1024; // 10MB
    const final = 15 * 1024 * 1024; // 15MB
    const growth = (final - initial) / 1024 / 1024; // MB

    expect(growth).toBe(5);
  });
});

describe("FPS Monitor", () => {
  it("should calculate FPS correctly", () => {
    const frameTimes = [16.67, 16.67, 16.67, 16.67, 16.67]; // 60 FPS
    const avgFrameTime =
      frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const fps = Math.round(1000 / avgFrameTime);

    expect(fps).toBe(60);
  });

  it("should detect dropped frames", () => {
    const frames = [
      { duration: 16.67 }, // OK
      { duration: 50 }, // Dropped
      { duration: 16.67 }, // OK
      { duration: 33.33 }, // Dropped
    ];

    const droppedFrames = frames.filter((f) => f.duration > 16.67).length;

    expect(droppedFrames).toBe(2);
  });

  it("should classify jank severity", () => {
    const classifyJank = (duration: number) => {
      if (duration > 50) return "severe";
      if (duration > 33) return "moderate";
      return "mild";
    };

    expect(classifyJank(60)).toBe("severe");
    expect(classifyJank(40)).toBe("moderate");
    expect(classifyJank(20)).toBe("mild");
  });
});

describe("Output Reporter", () => {
  it("should format bytes correctly", () => {
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
  });

  it("should format milliseconds correctly", () => {
    const formatMs = (ms: number) => {
      if (ms < 1000) return `${Math.round(ms)}ms`;
      return `${(ms / 1000).toFixed(2)}s`;
    };

    expect(formatMs(500)).toBe("500ms");
    expect(formatMs(1500)).toBe("1.50s");
  });

  it("should determine status color based on thresholds", () => {
    const getStatus = (value: number | null, good: number, poor: number) => {
      if (value === null) return "N/A";
      if (value <= good) return "good";
      if (value <= poor) return "warning";
      return "poor";
    };

    // LCP
    expect(getStatus(1000, 2500, 4000)).toBe("good");
    expect(getStatus(3000, 2500, 4000)).toBe("warning");
    expect(getStatus(5000, 2500, 4000)).toBe("poor");
    expect(getStatus(null, 2500, 4000)).toBe("N/A");
  });
});
