// Core type definitions for AutoReview

export interface BrowserOptions {
  headless?: boolean;
  args?: string[];
  viewport?: Viewport;
  userDataDir?: string;
  devtools?: boolean;
}

export interface Viewport {
  width: number;
  height: number;
  isMobile?: boolean;
  isLandscape?: boolean;
  deviceScaleFactor?: number;
}

export interface NavigationOptions {
  waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
  timeout?: number;
}

export interface CoreWebVitals {
  /** Largest Contentful Paint (ms) */
  lcp: number | null;
  /** First Input Delay (ms) */
  fid: number | null;
  /** Cumulative Layout Shift */
  cls: number | null;
  /** Interaction to Next Paint (ms) */
  inp: number | null;
  /** Time to First Byte (ms) */
  ttfb: number | null;
  /** First Contentful Paint (ms) */
  fcp: number | null;
  /** Time to Interactive (ms) */
  tti: number | null;
}

export interface PerformanceMetrics {
  timestamp: number;
  documents: number;
  frames: number;
  nodes: number;
  jsHeapUsedSize: number;
  jsHeapTotalSize: number;
  layoutCount: number;
  recalcStyleCount: number;
  layoutDuration: number;
  recalcStyleDuration: number;
  scriptDuration: number;
  taskDuration: number;
}

export interface NetworkMetrics {
  requestCount: number;
  transferSize: number;
  latency: number;
  resources: ResourceInfo[];
}

export interface ResourceInfo {
  url: string;
  type: string;
  method: string;
  status: number;
  responseTime: number;
  transferSize: number;
}

export interface AuditResult {
  id: string;
  title: string;
  score: number;
  description: string;
  details?: Record<string, unknown>;
}

export interface LighthouseReport {
  url: string;
  timestamp: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
  audits: AuditResult[];
  coreWebVitals: CoreWebVitals;
}

export interface TestResult {
  url: string;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
  metrics?: {
    coreWebVitals?: CoreWebVitals;
    performance?: PerformanceMetrics;
    network?: NetworkMetrics;
    lighthouse?: LighthouseReport;
  };
}

export interface CLIOptions {
  url: string;
  output?: string;
  format?: "json" | "html" | "console";
  iterations?: number;
  headless?: boolean;
  devtools?: boolean;
  watch?: boolean;
  config?: string;
  verbose?: boolean;
  duration?: number;
  network?: string;
  cpu?: number;
  viewport?: string;
  mobile?: boolean;
  waitUntil?: string;
  timeout?: number;
}

export interface Config {
  browser: BrowserOptions;
  navigation: NavigationOptions;
  iterations: number;
  timeout: number;
  networkThrottling?: NetworkThrottling;
  cpuThrottling?: number;
}

export type NetworkThrottlingPreset =
  | "online"
  | "offline"
  | "slow-2g"
  | "fast-2g"
  | "3g"
  | "fast-3g"
  | "4g";

export interface NetworkThrottling {
  offline: boolean;
  downloadThroughput: number;
  uploadThroughput: number;
  latency: number;
}
