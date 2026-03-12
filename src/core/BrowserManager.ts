import { launch, Browser, Page } from "puppeteer-core";
import { existsSync } from "fs";
import type {
  Config,
  NetworkThrottling,
  NetworkThrottlingPreset,
} from "./types.js";

function findChrome(): string | undefined {
  const locations = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : process.platform === "linux"
        ? "/usr/bin/google-chrome"
        : undefined,
  ].filter(Boolean) as string[];

  for (const loc of locations) {
    if (loc && existsSync(loc)) {
      return loc;
    }
  }
  return undefined;
}

const NETWORK_PRESETS: Record<NetworkThrottlingPreset, NetworkThrottling> = {
  online: {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  },
  offline: {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  },
  "slow-2g": {
    offline: false,
    downloadThroughput: 40000,
    uploadThroughput: 40000,
    latency: 2000,
  },
  "fast-2g": {
    offline: false,
    downloadThroughput: 70000,
    uploadThroughput: 30000,
    latency: 1500,
  },
  "3g": {
    offline: false,
    downloadThroughput: 700000,
    uploadThroughput: 300000,
    latency: 400,
  },
  "fast-3g": {
    offline: false,
    downloadThroughput: 1500000,
    uploadThroughput: 750000,
    latency: 170,
  },
  "4g": {
    offline: false,
    downloadThroughput: 4000000,
    uploadThroughput: 3000000,
    latency: 20,
  },
};

export class BrowserManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: Config;

  constructor(config: Partial<Config> = {}) {
    this.config = {
      browser: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        viewport: { width: 1920, height: 1080 },
        ...config.browser,
      },
      navigation: {
        waitUntil: "networkidle2",
        timeout: 30000,
        ...config.navigation,
      },
      iterations: 1,
      timeout: 30000,
      ...config,
    };
  }

  async launch(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    const chromePath = findChrome();

    const options = {
      headless: this.config.browser.headless,
      args: this.config.browser.args,
      devtools: this.config.browser.devtools,
      executablePath: chromePath,
    };

    this.browser = await launch(options);
    return this.browser;
  }

  async newPage(): Promise<Page> {
    if (!this.browser) {
      await this.launch();
    }

    this.page = await this.browser!.newPage();

    if (this.config.browser.viewport) {
      await this.page.setViewport(this.config.browser.viewport);
    }

    return this.page;
  }

  async setNetworkThrottling(preset: NetworkThrottlingPreset): Promise<void> {
    if (!this.page) {
      throw new Error("Page not initialized");
    }

    const client = await this.page.target().createCDPSession();
    const networkConditions = NETWORK_PRESETS[preset];

    await client.send("Network.emulateNetworkConditions", {
      offline: networkConditions.offline,
      downloadThroughput: networkConditions.downloadThroughput,
      uploadThroughput: networkConditions.uploadThroughput,
      latency: networkConditions.latency,
    });
  }

  async setCPUThrottling(rate: number): Promise<void> {
    if (!this.page) {
      throw new Error("Page not initialized");
    }

    const client = await this.page.target().createCDPSession();
    await client.send("Emulation.setCPUThrottlingRate", { rate });
  }

  async navigate(url: string): Promise<Page> {
    if (!this.page) {
      await this.newPage();
    }

    await this.page!.goto(url, {
      waitUntil: this.config.navigation.waitUntil,
      timeout: this.config.navigation.timeout,
    });

    return this.page!;
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getPage(): Page | null {
    return this.page;
  }

  getBrowser(): Browser | null {
    return this.browser;
  }

  isReady(): boolean {
    return this.browser !== null && this.page !== null;
  }

  static get NetworkPresets(): Record<
    NetworkThrottlingPreset,
    NetworkThrottling
  > {
    return NETWORK_PRESETS;
  }
}
