import type { Page } from "puppeteer-core";

declare const window: {
  __FPS__: {
    frames: Array<{ timestamp: number; duration: number }>;
    lastFrameTime: number;
    janks: Array<{ startTime: number; duration: number; severity: string }>;
  };
};

interface FPSResult {
  fps: number;
  frames: number;
  droppedFrames: number;
  avgFrameTime: number;
  janks: JankEvent[];
}

interface JankEvent {
  startTime: number;
  duration: number;
  severity: "mild" | "moderate" | "severe";
}

const FPS_SCRIPT = `
(function() {
  window.__FPS__ = {
    frames: [],
    lastFrameTime: 0,
    janks: []
  };

  function measureFrame(timestamp) {
    if (!window.__FPS__.lastFrameTime) {
      window.__FPS__.lastFrameTime = timestamp;
      requestAnimationFrame(measureFrame);
      return;
    }

    const delta = timestamp - window.__FPS__.lastFrameTime;
    window.__FPS__.frames.push({
      timestamp: timestamp,
      duration: delta
    });

    if (window.__FPS__.frames.length > 300) {
      window.__FPS__.frames.shift();
    }

    if (delta > 16.67) {
      let severity = 'mild';
      if (delta > 50) severity = 'severe';
      else if (delta > 33) severity = 'moderate';

      window.__FPS__.janks.push({
        startTime: timestamp,
        duration: delta,
        severity: severity
      });

      if (window.__FPS__.janks.length > 50) {
        window.__FPS__.janks.shift();
      }
    }

    window.__FPS__.lastFrameTime = timestamp;
    requestAnimationFrame(measureFrame);
  }

  requestAnimationFrame(measureFrame);
})();
`;

export class FPSMonitor {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async inject(): Promise<void> {
    await this.page.evaluateOnNewDocument(FPS_SCRIPT);
  }

  async getFPS(): Promise<FPSResult> {
    const stats = await this.page.evaluate(() => {
      if (!window.__FPS__ || window.__FPS__.frames.length < 2) {
        return {
          fps: 0,
          frames: 0,
          droppedFrames: 0,
          avgFrameTime: 0,
          janks: [],
        };
      }

      const frames = window.__FPS__.frames;
      const recentFrames = frames.slice(-60);

      let totalDuration = 0;
      for (let i = 1; i < recentFrames.length; i++) {
        totalDuration += recentFrames[i].duration;
      }

      const avgFrameTime = totalDuration / (recentFrames.length - 1);
      const fps = Math.round(1000 / avgFrameTime);

      let droppedFrames = 0;
      for (let i = 1; i < frames.length; i++) {
        if (frames[i].duration > 16.67) {
          droppedFrames++;
        }
      }

      return {
        fps,
        frames: frames.length,
        droppedFrames,
        avgFrameTime,
        janks: window.__FPS__.janks.slice(-20),
      };
    });

    return stats as FPSResult;
  }

  async startMonitoring(durationSeconds: number = 10): Promise<FPSResult> {
    const startTime = Date.now();
    let lastResult: FPSResult = {
      fps: 0,
      frames: 0,
      droppedFrames: 0,
      avgFrameTime: 0,
      janks: [],
    };

    while (Date.now() - startTime < durationSeconds * 1000) {
      lastResult = await this.getFPS();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return lastResult;
  }
}
