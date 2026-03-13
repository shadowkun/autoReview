# AutoReview

Frontend performance testing and analytics CLI tool.

## Features

- **Core Web Vitals** - LCP, FID, CLS, INP, TTFB measurement
- **FPS Monitoring** - Real-time frame rate and jank detection
- **Memory Profiling** - Heap snapshot and memory leak detection
- **JS Performance** - CPU profiling and function execution analysis
- **Lighthouse Integration** - Comprehensive performance audits
- **Trace Analysis** - Chrome DevTools trace file analysis

## Installation

```bash
npm install
```

## Usage

### Comprehensive Check (Recommended)

```bash
node ./dist/cli/index.js check <url>
```

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

### Options

| Option          | Description                                                    | Default   |
| --------------- | -------------------------------------------------------------- | --------- |
| `--network`     | Network throttling (online, slow-2g, 3g, fast-3g, 4g, offline) | online    |
| `--cpu`         | CPU throttling rate (1=normal, 4=4x slower)                    | 1         |
| `--viewport`    | Viewport size (e.g., 1920x1080)                                | 1920x1080 |
| `--mobile`      | Emulate mobile device                                          | false     |
| `--no-headless` | Run in visible mode                                            | headless  |
| `-o, --output`  | Output file path                                               | -         |
| `--duration`    | Monitoring duration (seconds)                                  | 10        |

### Examples

```bash
# Test with slow network
node ./dist/cli/index.js check https://example.com --network 3g

# Test with mobile emulation
node ./dist/cli/index.js check https://example.com --mobile

# Test with CPU throttling
node ./dist/cli/index.js check https://example.com --cpu 4

# Output to JSON
node ./dist/cli/index.js check https://example.com -o results.json

# Capture trace and analyze
node ./dist/cli/index.js trace https://example.com -o trace.json
node ./dist/cli/index.js analyze trace.json -o report.md
```

## Output

The tool provides detailed analysis including:

- **Core Web Vitals** scores with pass/fail indicators
- **FPS** monitoring with dropped frame detection
- **Memory** analysis with leak detection
- **JS Performance** profiling with top functions
- **Network** request analysis
- **Recommendations** for optimization

## Exit

Press `Ctrl+C` or `Ctrl+Z` to exit.

## Requirements

- Node.js 18+
- Google Chrome (or Chromium)
