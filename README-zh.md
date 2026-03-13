# AutoReview

前端性能测试与分析 CLI 工具，面向 AI Agent 和开发者。

## 功能特性

- **Core Web Vitals** - LCP, FID, CLS, INP, TTFB 测量
- **FPS 监控** - 实时帧率与卡顿检测
- **内存分析** - 堆快照与内存泄漏检测
- **JS 性能分析** - CPU profiling 与函数执行分析
- **Lighthouse 集成** - 全面的性能审计
- **Trace 分析** - Chrome DevTools trace 文件分析与问题定位
- **AI 友好输出** - JSON 格式，便于 LLM 分析

## 快速开始

```bash
# 安装依赖
npm install

# 构建 TypeScript
npm run build

# 运行综合检测
node ./dist/cli/index.js check https://example.com
```

## 使用方法

### 综合检测（推荐）

```bash
node ./dist/cli/index.js check <url>
```

运行全部测试：

1. Core Web Vitals (LCP, CLS, TTFB 等)
2. FPS 监控（掉帧、卡顿）
3. 内存分析（泄漏检测）
4. JS 性能分析（CPU profiling）

### 单独测试

```bash
# 仅测 Core Web Vitals
node ./dist/cli/index.js cwv <url>

# 完整性能测试 (CWV + Lighthouse)
node ./dist/cli/index.js perf <url>

# 捕获 trace（用于火焰图）
node ./dist/cli/index.js trace <url>

# 分析现有 trace 文件
node ./dist/cli/index.js analyze <trace.json>
```

## 输出目录

默认输出目录：`tests/`

```bash
# 保存结果到 tests/
node ./dist/cli/index.js check https://example.com -o tests/result.json

# 保存 trace 到 tests/
node ./dist/cli/index.js trace https://example.com -o tests/trace.json

# 保存分析报告到 tests/
node ./dist/cli/index.js analyze tests/trace.json -o tests/report.md
```

## 命令选项

| 选项            | 说明                                                         | 默认值       |
| --------------- | ------------------------------------------------------------ | ------------ |
| `--network`     | 网络节流: slow-2g, 3g, fast-3g, 4g, offline                  | online       |
| `--cpu`         | CPU 节流倍数 (1=正常, 4=4倍慢)                               | 1            |
| `--viewport`    | 视口大小 (如 1920x1080)                                      | 1920x1080    |
| `--mobile`      | 移动设备模拟 (375x812)                                       | false        |
| `--no-headless` | 显示浏览器窗口                                               | headless     |
| `-o, --output`  | 输出文件路径                                                 | -            |
| `--duration`    | 监控时长（秒）                                               | 10           |
| `--wait-until`  | 等待事件: load, domcontentloaded, networkidle0, networkidle2 | networkidle2 |

## 使用示例

```bash
# 基础检测
node ./dist/cli/index.js check https://example.com -o tests/result.json

# 模拟慢速网络
node ./dist/cli/index.js check https://example.com --network 3g -o tests/result.json

# 移动设备模拟
node ./dist/cli/index.js check https://example.com --mobile -o tests/result.json

# CPU 节流（4倍慢）
node ./dist/cli/index.js check https://example.com --cpu 4 -o tests/result.json

# 捕获 trace（用于火焰图）
node ./dist/cli/index.js trace https://example.com -o tests/trace.json

# 分析 trace 并生成 LLM 友好报告
node ./dist/cli/index.js analyze tests/trace.json -o tests/report.md
```

## 输出解读

### Core Web Vitals

| 指标 | 良好    | 需要改进       | 较差     |
| ---- | ------- | -------------- | -------- |
| LCP  | < 2.5s  | 2.5s - 4s      | > 4s     |
| CLS  | < 0.1   | 0.1 - 0.25     | > 0.25   |
| FID  | < 100ms | 100ms - 300ms  | > 300ms  |
| INP  | < 200ms | 200ms - 500ms  | > 500ms  |
| TTFB | < 800ms | 800ms - 1800ms | > 1800ms |

### FPS

| 状态        | FPS   | 掉帧数 |
| ----------- | ----- | ------ |
| ✅ 良好     | 60    | 0      |
| ⚠️ 轻度卡顿 | 30-60 | 1-10   |
| ❌ 严重卡顿 | <30   | >10    |

### 内存

| 状态    | 内存增长 |
| ------- | -------- |
| ✅ 正常 | <1MB     |
| ⚠️ 轻微 | 1-5MB    |
| ❌ 泄漏 | >5MB     |

## 使用场景

### AI Agent 使用

```bash
# Agent 任务：分析页面性能
node ./dist/cli/index.js check https://example.com -o tests/result.json
# → 返回包含所有指标的 JSON

# Agent 任务：查找渲染问题
node ./dist/cli/index.js trace https://example.com -o tests/trace.json
# → 使用 Chrome DevTools 加载 trace.json

# Agent 任务：LLM 调试分析
node ./dist/cli/index.js analyze tests/trace.json -o tests/report.md
# → LLM 友好的 Markdown 报告
```

### CI/CD 集成

```bash
# 退出码 0 = 通过, 1 = 失败
node ./dist/cli/index.js perf https://example.com -o tests/lighthouse.json

# 检查 Lighthouse 分数
jq '.metrics.lighthouse.performance' tests/lighthouse.json
```

## 退出

按 `Ctrl+C` 或 `Ctrl+Z` 正常退出。

## 故障排除

### 找不到 Chrome

设置 `CHROME_PATH` 环境变量：

```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### 权限错误

```bash
chmod +x ./dist/cli/index.js
```

### 网络错误

使用 `--no-headless` 查看浏览器错误，或尝试 `--network online`。

## 环境要求

- Node.js 18+
- Google Chrome / Chromium 已安装

## 许可证

MIT License - 见 [LICENSE](LICENSE)
