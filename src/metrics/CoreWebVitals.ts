import type { Page } from "puppeteer-core";
import type { CoreWebVitals } from "../core/types.js";

declare const window: {
  __CWV__: CoreWebVitals;
};

const CWV_SCRIPT = `
(function() {
  window.__CWV__ = {
    lcp: null,
    fid: null,
    cls: null,
    inp: null,
    ttfb: null,
    fcp: null,
    tti: null
  };

  try {
    new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      var lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        window.__CWV__.fcp = lastEntry.startTime;
      }
    }).observe({entryTypes: ['first-contentful-paint']});

    new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.entryType === 'largest-contentful-paint') {
          window.__CWV__.lcp = entry.startTime;
        }
      }
    }).observe({entryTypes: ['largest-contentful-paint']});

    new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.entryType === 'first-input') {
          window.__CWV__.fid = entry.processingStart - entry.startTime;
        }
      }
    }).observe({entryTypes: ['first-input']});

    new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      var cls = 0;
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (!entry.hadRecentInput && entry.value) {
          cls += entry.value;
        }
      }
      if (cls > 0) {
        window.__CWV__.cls = cls;
      }
    }).observe({entryTypes: ['layout-shift']});

    new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      var maxINP = 0;
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.entryType === 'event' && entry.interactionId) {
          var inp = entry.processingStart - entry.startTime;
          if (inp > maxINP) maxINP = inp;
        }
      }
      if (maxINP > 0) {
        window.__CWV__.inp = maxINP;
      }
    }).observe({entryTypes: ['event']});

    var navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry) {
      window.__CWV__.ttfb = navEntry.responseStart;
    }
  } catch(e) {
    console.error('CWV init error:', e);
  }
})();
`;

export class CoreWebVitalsCollector {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async inject(): Promise<void> {
    await this.page.evaluateOnNewDocument(CWV_SCRIPT);
  }

  async collect(): Promise<CoreWebVitals> {
    try {
      const metrics = await this.page.evaluate(() => {
        if (!window.__CWV__) {
          return {
            lcp: null,
            fid: null,
            cls: null,
            inp: null,
            ttfb: null,
            fcp: null,
            tti: null,
          };
        }
        return window.__CWV__;
      });
      return metrics as CoreWebVitals;
    } catch (error) {
      return {
        lcp: null,
        fid: null,
        cls: null,
        inp: null,
        ttfb: null,
        fcp: null,
        tti: null,
      };
    }
  }

  async waitForStable(timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    let lastCWV = await this.collect();
    let stableCount = 0;

    while (Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const currentCWV = await this.collect();

      if (JSON.stringify(currentCWV) === JSON.stringify(lastCWV)) {
        stableCount++;
        if (stableCount >= 3) {
          break;
        }
      } else {
        stableCount = 0;
      }
      lastCWV = currentCWV;
    }
  }
}
