# AutoReview Skill

## Overview

AutoReview is a frontend performance testing and analytics CLI tool that enables AI agents to measure, analyze, and debug performance issues in web applications.

## For AI Agents

When a user asks to test, analyze, or debug frontend performance, use this skill.

### Trigger Phrases

- "test performance"
- "analyze page performance"
- "check web vitals"
- "debug rendering issues"
- "profile memory leak"
- "check FPS"
- "measure load time"
- "performance audit"

### Capabilities

| Capability              | Command          | Description                            |
| ----------------------- | ---------------- | -------------------------------------- |
| **Comprehensive Check** | `check <url>`    | Full analysis: CWV + FPS + Memory + JS |
| **Core Web Vitals**     | `cwv <url>`      | LCP, FID, CLS, INP, TTFB               |
| **Performance Test**    | `perf <url>`     | CWV + Lighthouse audit                 |
| **Trace Capture**       | `trace <url>`    | Chrome DevTools trace for flame graph  |
| **Trace Analysis**      | `analyze <file>` | Analyze trace and find problems        |

### Output Directory

Default output directory: `tests/`

All output files (JSON reports, trace files, etc.) should be saved to the `tests/` directory.

### Usage Examples

```bash
# Comprehensive performance check
node ./dist/cli/index.js check https://example.com

# Check and save results to tests/
node ./dist/cli/index.js check https://example.com -o tests/result.json

# Test with network throttling
node ./dist/cli/index.js check https://example.com --network 3g -o tests/result.json

# Test with mobile emulation
node ./dist/cli/index.js check https://example.com --mobile -o tests/result.json

# Capture trace for flame graph analysis
node ./dist/cli/index.js trace https://example.com -o tests/trace.json

# Analyze existing trace
node ./dist/cli/index.js analyze tests/trace.json -o tests/report.md
```

### Options

| Option          | Description                                           |
| --------------- | ----------------------------------------------------- |
| `--network`     | Network throttling: slow-2g, 3g, fast-3g, 4g, offline |
| `--cpu`         | CPU throttling rate (1-8)                             |
| `--viewport`    | Viewport size (e.g., 1920x1080)                       |
| `--mobile`      | Mobile device emulation                               |
| `--no-headless` | Show browser window                                   |
| `-o, --output`  | Output file path (default: tests/)                    |

### Output Interpretation

**Core Web Vitals:**

- ✅ Good: LCP < 2.5s, CLS < 0.1, FID < 100ms
- ⚠️ Needs Improvement: LCP 2.5-4s, CLS 0.1-0.25, FID 100-300ms
- ❌ Poor: LCP > 4s, CLS > 0.25, FID > 300ms

**FPS:**

- ✅ Good: 60 FPS (0 dropped frames)
- ⚠️ Mild Jank: 30-60 FPS (1-10 dropped)
- ❌ Severe Jank: <30 FPS (>10 dropped)

**Memory:**

- ✅ OK: No memory growth detected
- ⚠️ Minor: 1-5MB growth
- ❌ Leak: >5MB growth

### Integration Example

```typescript
// In an AI agent
async function analyzePerformance(url: string): Promise<string> {
  const outputDir = "tests";
  const resultFile = `${outputDir}/result.json`;

  await exec(`node ./dist/cli/index.js check ${url} -o ${resultFile}`);

  const result = JSON.parse(await readFile(resultFile));

  return formatPerformanceReport(result);
}
```

## Requirements

- Node.js 18+
- Google Chrome / Chromium
