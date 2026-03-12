export { BrowserManager } from './core/BrowserManager.js';
export type { 
  BrowserOptions, 
  Viewport, 
  NavigationOptions, 
  CoreWebVitals,
  PerformanceMetrics,
  NetworkMetrics,
  AuditResult,
  LighthouseReport,
  TestResult,
  CLIOptions,
  Config 
} from './core/types.js';

export { CoreWebVitalsCollector } from './metrics/CoreWebVitals.js';
export { LighthouseAdapter } from './audits/LighthouseAdapter.js';
export { ConsoleReporter } from './reporters/ConsoleReporter.js';
export { JsonReporter } from './reporters/JsonReporter.js';
