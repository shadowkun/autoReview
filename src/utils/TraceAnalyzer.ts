import { readFile } from "fs/promises";
import { existsSync } from "fs";

interface TraceEvent {
  name: string;
  cat: string;
  ph: string;
  pid: number;
  tid: number;
  ts: number;
  dur?: number;
  args?: Record<string, unknown>;
}

interface TraceData {
  traceEvents: TraceEvent[];
  metadata?: Record<string, unknown>;
}

interface EventStats {
  name: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  events: TraceEvent[];
}

interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  type: string;
  startTime: number;
  duration: number;
  size: number;
  timing?: Record<string, number>;
}

interface LongTask {
  startTime: number;
  duration: number;
  stack?: string[];
}

interface ProblemLocation {
  type: string;
  description: string;
  location?: string;
  suggestion: string;
  severity: "critical" | "warning" | "info";
}

interface AnalysisResult {
  summary: string;
  slowOperations: EventStats[];
  frequentOperations: EventStats[];
  networkRequests: NetworkRequest[];
  longTasks: LongTask[];
  problems: ProblemLocation[];
  keyInsights: string[];
  recommendations: string[];
}

function analyzeTrace(data: TraceData): AnalysisResult {
  const events = data.traceEvents;
  const url = (data.metadata?.url as string) || "Unknown";

  // === 1. 基础事件统计 ===
  const durationEvents = events.filter((e) => e.dur && e.dur > 0);
  const eventCounts = new Map<string, EventStats>();

  for (const event of durationEvents) {
    const name = event.name;
    if (!eventCounts.has(name)) {
      eventCounts.set(name, {
        name,
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        events: [],
      });
    }
    const stats = eventCounts.get(name)!;
    stats.count++;
    stats.totalDuration += event.dur!;
    stats.maxDuration = Math.max(stats.maxDuration, event.dur!);
    stats.minDuration = Math.min(stats.minDuration, event.dur!);
    stats.events.push(event);
  }

  for (const stats of eventCounts.values()) {
    stats.avgDuration = stats.totalDuration / stats.count;
  }

  const sortedByDuration = Array.from(eventCounts.values())
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 20);

  const sortedByCount = Array.from(eventCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // === 2. 网络请求分析 ===
  const requestMap = new Map<string, NetworkRequest>();

  for (const event of events) {
    if (event.name === "ResourceSendRequest" && event.args?.data) {
      const d = event.args.data as Record<string, unknown>;
      requestMap.set(d.requestId as string, {
        url: (d.url as string) || "Unknown",
        method: (d.requestMethod as string) || "GET",
        status: 0,
        type: (d.resourceType as string) || "Other",
        startTime: event.ts,
        duration: 0,
        size: 0,
      });
    }
    if (event.name === "ResourceReceiveResponse" && event.args?.data) {
      const d = event.args.data as Record<string, unknown>;
      const req = requestMap.get(d.requestId as string);
      if (req) {
        req.status = (d.statusCode as number) || 0;
        req.duration = event.ts - req.startTime;
        if (d.timing) {
          req.timing = d.timing as Record<string, number>;
        }
      }
    }
    if (event.name === "ResourceFinish" && event.args?.data) {
      const d = event.args.data as Record<string, unknown>;
      const req = requestMap.get(d.requestId as string);
      if (req) {
        req.size =
          (d.encodedDataLength as number) ||
          (d.decodedBodyLength as number) ||
          0;
      }
    }
  }

  const sortedRequests = Array.from(requestMap.values())
    .filter((r) => r.duration > 0)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 30);

  // === 3. Long Tasks ===
  const longTasks: LongTask[] = [];
  const mainThreadEvents = durationEvents.filter(
    (e) =>
      e.tid ===
      Math.min(...Array.from(new Set(durationEvents.map((ev) => ev.tid)))),
  );

  for (const event of mainThreadEvents.sort((a, b) => a.ts - b.ts)) {
    if (event.dur && event.dur > 50000) {
      longTasks.push({
        startTime: event.ts,
        duration: event.dur,
        stack: extractStack(event),
      });
    }
  }

  longTasks.sort((a, b) => b.duration - a.duration);

  function extractStack(event: TraceEvent): string[] | undefined {
    if (event.args?.stackTrace) {
      const stack = event.args.stackTrace as Array<{
        functionName?: string;
        url?: string;
        lineNumber?: number;
      }>;
      return stack.slice(0, 5).map((s) => s.functionName || s.url || "unknown");
    }
    return undefined;
  }

  // === 4. 渲染流水线分析 ===
  const renderCategories = {
    layout: ["UpdateLayoutTree", "Layout", "RecalcStyle", "CalculateLayout"],
    paint: [
      "Paint",
      "PaintLayer",
      "PaintImage",
      "Raster",
      "RasterizePaintChunks",
    ],
    composite: ["CompositeLayers", "Compositing", "Layerize", "UpdateLayers"],
    script: [
      "EvaluateScript",
      "v8.compile",
      "V8.Execute",
      "FunctionCall",
      "RunMicrotasks",
    ],
  };

  const renderStats: Record<string, { count: number; duration: number }> = {
    layout: { count: 0, duration: 0 },
    paint: { count: 0, duration: 0 },
    composite: { count: 0, duration: 0 },
    script: { count: 0, duration: 0 },
  };

  for (const [category, names] of Object.entries(renderCategories)) {
    for (const name of names) {
      const stats = eventCounts.get(name);
      if (stats) {
        renderStats[category].count += stats.count;
        renderStats[category].duration += stats.totalDuration;
      }
    }
  }

  // === 5. 问题定位 ===
  const problems: ProblemLocation[] = [];

  // 慢请求
  for (const req of sortedRequests.slice(0, 5)) {
    if (req.duration > 1000000) {
      problems.push({
        type: "slow-network",
        description: `Slow request: ${req.method} ${req.url.substring(0, 50)}... took ${(req.duration / 1000).toFixed(2)}ms`,
        location: req.url,
        suggestion:
          "Consider: 1) CDN 2) Compression 3) Caching 4) Code splitting",
        severity: "critical",
      });
    }
  }

  // 阻塞任务
  for (const task of longTasks.slice(0, 3)) {
    problems.push({
      type: "long-task",
      description: `Long task blocking main thread: ${(task.duration / 1000).toFixed(2)}ms`,
      location: task.stack ? task.stack[0] : "unknown",
      suggestion:
        "Break up long tasks using: requestAnimationFrame, Web Workers, or async/await",
      severity: "critical",
    });
  }

  // 频繁操作
  for (const event of sortedByCount.slice(0, 5)) {
    if (event.count > 500 && event.avgDuration > 1000) {
      problems.push({
        type: "frequent-slow",
        description: `${event.name} executed ${event.count} times (avg ${event.avgDuration.toFixed(2)}ms)`,
        location: event.name,
        suggestion:
          "Consider: debouncing, caching, or removing unnecessary calls",
        severity: "warning",
      });
    }
  }

  // 大资源
  for (const req of sortedRequests) {
    if (req.size > 500000 && req.type !== "Document") {
      problems.push({
        type: "large-resource",
        description: `Large resource (${(req.size / 1024 / 1024).toFixed(2)}MB): ${req.type}`,
        location: req.url,
        suggestion: "Compress, lazy-load, or use modern formats (WebP, AVIF)",
        severity: "warning",
      });
      break;
    }
  }

  // 渲染问题
  if (renderStats.layout.duration > 500000) {
    problems.push({
      type: "layout-thrashing",
      description: `Excessive layout operations: ${(renderStats.layout.duration / 1000).toFixed(2)}ms total`,
      suggestion:
        "Avoid: 1) Reading DOM after writing 2) Forced reflow 3) Complex selectors",
      severity: "warning",
    });
  }

  // === 6. 关键发现和建议 ===
  const keyInsights: string[] = [];
  const recommendations: string[] = [];

  if (longTasks.length > 0) {
    keyInsights.push(
      `Found ${longTasks.length} long tasks blocking main thread`,
    );
    recommendations.push(
      "Break up long JavaScript tasks to improve responsiveness",
    );
  }

  if (sortedRequests.filter((r) => r.duration > 1000000).length > 0) {
    keyInsights.push(
      `${sortedRequests.filter((r) => r.duration > 1000000).length} requests took >1s`,
    );
  }

  if (
    renderStats.script.duration >
    renderStats.layout.duration + renderStats.paint.duration
  ) {
    keyInsights.push("JavaScript execution dominates rendering time");
    recommendations.push(
      "Optimize JS: reduce main thread work, use Web Workers",
    );
  }

  const slowestOp = sortedByDuration[0];
  if (slowestOp && slowestOp.avgDuration > 50000) {
    keyInsights.push(
      `Slowest operation: ${slowestOp.name} (avg ${(slowestOp.avgDuration / 1000).toFixed(2)}ms)`,
    );
  }

  // 生成报告
  const summary = `# 🔍 Performance Analysis Report

**URL**: ${url}
**Total Events**: ${events.length.toLocaleString()}
**Duration Events**: ${durationEvents.length.toLocaleString()}
**Unique Operations**: ${eventCounts.size}

---

## 🚨 Critical Problems Found: ${problems.length}

${problems
  .map(
    (p, i) => `
### ${i + 1}. [${p.severity.toUpperCase()}] ${p.type.replace("-", " ")}
**Description**: ${p.description}
${p.location ? `**Location**: ${p.location}` : ""}
**Suggestion**: ${p.suggestion}
`,
  )
  .join("\n")}

---

## 📊 Render Pipeline Breakdown

| Category | Count | Total Duration |
|----------|-------|----------------|
| JavaScript | ${renderStats.script.count} | ${(renderStats.script.duration / 1000).toFixed(2)}ms |
| Layout | ${renderStats.layout.count} | ${(renderStats.layout.duration / 1000).toFixed(2)}ms |
| Paint | ${renderStats.paint.count} | ${(renderStats.paint.duration / 1000).toFixed(2)}ms |
| Composite | ${renderStats.composite.count} | ${(renderStats.composite.duration / 1000).toFixed(2)}ms |

---

## 🐢 Top Slowest Operations

${sortedByDuration
  .slice(0, 10)
  .map(
    (e, i) => `
${i + 1}. **${e.name}**
   - Avg: ${(e.avgDuration / 1000).toFixed(2)}ms
   - Count: ${e.count}
   - Total: ${(e.totalDuration / 1000).toFixed(2)}ms
`,
  )
  .join("\n")}

---

## 🔄 Most Frequent Operations

${sortedByCount
  .slice(0, 10)
  .map(
    (e, i) => `
${i + 1}. **${e.name}** - ${e.count} times (avg ${(e.avgDuration / 1000).toFixed(2)}ms)
`,
  )
  .join("\n")}

---

## 🌐 Top Slowest Network Requests

${sortedRequests
  .slice(0, 10)
  .map(
    (r, i) => `
${i + 1}. **[${r.status}]** ${r.type}
   - ${r.method} ${r.url.substring(0, 60)}...
   - Time: ${(r.duration / 1000).toFixed(2)}ms
   - Size: ${(r.size / 1024).toFixed(1)}KB
`,
  )
  .join("\n")}

---

## 💡 Recommendations

${recommendations.length > 0 ? recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n") : "✅ No critical issues found!"}

---

*Generated by AutoReview Trace Analyzer*`;

  return {
    summary,
    slowOperations: sortedByDuration,
    frequentOperations: sortedByCount,
    networkRequests: sortedRequests,
    longTasks,
    problems,
    keyInsights,
    recommendations,
  };
}

export async function analyzeTraceFile(
  filePath: string,
): Promise<AnalysisResult> {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = await readFile(filePath, "utf-8");
  const data = JSON.parse(content) as TraceData;

  if (!data.traceEvents || !Array.isArray(data.traceEvents)) {
    throw new Error("Invalid trace file format: missing traceEvents array");
  }

  return analyzeTrace(data);
}

export {
  AnalysisResult,
  EventStats,
  NetworkRequest,
  ProblemLocation,
  LongTask,
};
