import lighthouse from "lighthouse";
import type { Browser } from "puppeteer-core";
import type { LighthouseReport, AuditResult } from "../core/types.js";

interface LHOptions {
  onlyCategories?: string[];
  throttlingMethod?: "simulate" | "devtools" | "provided";
}

export class LighthouseAdapter {
  private browser: Browser;
  private options: LHOptions;

  constructor(browser: Browser, options: LHOptions = {}) {
    this.browser = browser;
    this.options = {
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      throttlingMethod: "devtools",
      ...options,
    };
  }

  async run(url: string): Promise<LighthouseReport> {
    const port = new URL(this.browser.wsEndpoint()).port;

    const result = await lighthouse(url, {
      port: parseInt(port, 10),
      output: "json",
      onlyCategories: this.options.onlyCategories,
      throttlingMethod: this.options.throttlingMethod,
      logLevel: "silent",
    });

    if (!result) {
      throw new Error("Lighthouse failed to generate report");
    }

    const lhr = result.lhr;

    const audits = this.parseAudits(lhr.audits);
    const scores = this.parseScores(lhr.categories);

    return {
      url,
      timestamp: Date.now(),
      performance: scores.performance || 0,
      accessibility: scores.accessibility || 0,
      bestPractices: scores["best-practices"] || 0,
      seo: scores.seo || 0,
      pwa: scores.pwa || 0,
      audits,
      coreWebVitals: {
        lcp: lhr.audits["largest-contentful-paint"]?.numericValue || null,
        fid: lhr.audits["max-potential-fid"]?.numericValue || null,
        cls: lhr.audits["cumulative-layout-shift"]?.numericValue || null,
        inp: lhr.audits["interaction-to-next-paint"]?.numericValue || null,
        ttfb: lhr.audits["server-response-time"]?.numericValue || null,
        fcp: lhr.audits["first-contentful-paint"]?.numericValue || null,
        tti: lhr.audits["interactive"]?.numericValue || null,
      },
    };
  }

  private parseAudits(audits: Record<string, unknown>): AuditResult[] {
    const results: AuditResult[] = [];
    for (const [id, audit] of Object.entries(audits)) {
      const a = audit as {
        id: string;
        title: string;
        score: number | null;
        description: string;
        details?: Record<string, unknown>;
      };
      if (a.score !== null) {
        results.push({
          id: a.id || id,
          title: a.title,
          score: a.score,
          description: a.description,
          details: a.details || undefined,
        });
      }
    }
    return results;
  }

  private parseScores(
    categories: Record<string, unknown>,
  ): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const [key, cat] of Object.entries(categories)) {
      const c = cat as { id: string; title: string; score: number | null };
      scores[key] = Math.round((c.score ?? 0) * 100);
    }
    return scores;
  }
}
