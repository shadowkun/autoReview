# AutoReview

Frontend performance testing and analytics CLI tool for AI agents and developers.

## Features

- **Core Web Vitals** - LCP, FID, CLS, INP, TTFB measurement
- **FPS Monitoring** - Real-time frame rate and jank detection
- **Memory Profiling** - Heap snapshot and memory leak detection
- **JS Performance** - CPU profiling and function execution analysis
- **Lighthouse Integration** - Comprehensive performance audits
- **Trace Analysis** - Chrome DevTools trace file analysis with problem detection
- **AI-Ready Output** - JSON format optimized for LLM analysis

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run comprehensive check
node ./dist/cli/index.js check https://example.com
```

## Usage

### Comprehensive Check (Recommended)

```bash
node ./dist/cli/index.js check <url>
```

This runs all tests:

1. Core Web Vitals (LCP, CLS, TTFB, etc.)
2. FPS Monitoring (frame drops, jank)
3. Memory Analysis (leak detection)
4. JS Performance (CPU profiling)

### Individual Tests

```bash
# Core Web Vitals only
node ./dist/cli/index.js cwv <url>

# Full performance test (CWV + Lighthouse)
node ./dist/cli/index.js perf <url>

# Capture trace for Chrome DevTools
node ./dist/cli/index.js trace <url>

# Analyze existing trace file
node ./dist/cli/index.js analyze <trace.json>
```

## Output Directory

Default output directory: `tests/`

```bash
# Save results to tests/
node ./dist/cli/index.js check https://example.com -o tests/result.json

# Save trace to tests/
node ./dist/cli/index.js trace https://example.com -o tests/trace.json

# Save analysis report to tests/
node ./dist/cli/index.js analyze tests/trace.json -o tests/report.md
```

## Options

| Option          | Description                                                    | Default      |
| --------------- | -------------------------------------------------------------- | ------------ |
| `--network`     | Network throttling: slow-2g, 3g, fast-3g, 4g, offline          | online       |
| `--cpu`         | CPU throttling rate (1=normal, 4=4x slower)                    | 1            |
| `--viewport`    | Viewport size (e.g., 1920x1080)                                | 1920x1080    |
| `--mobile`      | Emulate mobile device (375x812)                                | false        |
| `--no-headless` | Run in visible browser window                                  | headless     |
| `-o, --output`  | Output file path                                               | -            |
| `--duration`    | Monitoring duration in seconds                                 | 10           |
| `--wait-until`  | Wait event: load, domcontentloaded, networkidle0, networkidle2 | networkidle2 |

## Examples

```bash
# Basic check
node ./dist/cli/index.js check https://example.com -o tests/result.json

# Slow network simulation
node ./dist/cli/index.js check https://example.com --network 3g -o tests/result.json

# Mobile device emulation
node ./dist/cli/index.js check https://example.com --mobile -o tests/result.json

# CPU throttling (4x slower)
node ./dist/cli/index.js check https://example.com --cpu 4 -o tests/result.json

# Capture trace for flame graph
node ./dist/cli/index.js trace https://example.com -o tests/trace.json

# Analyze trace and get LLM-friendly report
node ./dist/cli/index.js analyze tests/trace.json -o tests/report.md
```

## Output Interpretation

### Core Web Vitals

| Metric | Good    | Needs Improvement | Poor     |
| ------ | ------- | ----------------- | -------- |
| LCP    | < 2.5s  | 2.5s - 4s         | > 4s     |
| CLS    | < 0.1   | 0.1 - 0.25        | > 0.25   |
| FID    | < 100ms | 100ms - 300ms     | > 300ms  |
| INP    | < 200ms | 200ms - 500ms     | > 500ms  |
| TTFB   | < 800ms | 800ms - 1800ms    | > 1800ms |

### FPS

| Status         | FPS   | Dropped Frames |
| -------------- | ----- | -------------- |
| ✅ Good        | 60    | 0              |
| ⚠️ Mild Jank   | 30-60 | 1-10           |
| ❌ Severe Jank | <30   | >10            |

### Memory

| Status   | Growth |
| -------- | ------ |
| ✅ OK    | <1MB   |
| ⚠️ Minor | 1-5MB  |
| ❌ Leak  | >5MB   |

## Use Cases

### For AI Agents

```bash
# Agent task: Analyze page performance
node ./dist/cli/index.js check https://example.com -o tests/result.json
# → Returns JSON with all metrics

# Agent task: Find rendering issues
node ./dist/cli/index.js trace https://example.com -o tests/trace.json
# → Use Chrome DevTools to load trace.json

# Agent task: Debug with LLM
node ./dist/cli/index.js analyze tests/trace.json -o tests/report.md
# → LLM-friendly markdown report
```

### For CI/CD

```bash
# Exit code 0 = pass, 1 = fail
node ./dist/cli/index.js perf https://example.com -o tests/lighthouse.json

# Check Lighthouse score
jq '.metrics.lighthouse.performance' tests/lighthouse.json
```

## Exit

Press `Ctrl+C` or `Ctrl+Z` to exit cleanly.

## Troubleshooting

### Chrome not found

Set `CHROME_PATH` environment variable:

```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Permission denied

```bash
chmod +x ./dist/cli/index.js
```

### Network errors

Use `--no-headless` to see browser errors, or try `--network online`.

## Requirements

- Node.js 18+
- Google Chrome / Chromium installed

## License

MIT License - See [LICENSE](LICENSE)
