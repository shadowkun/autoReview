import { launch, Browser, Page } from 'puppeteer-core';
import { existsSync } from 'fs';
import type { Config } from './types.js';

function findChrome(): string | undefined {
  const locations = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    process.platform === 'win32' 
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : process.platform === 'linux'
        ? '/usr/bin/google-chrome'
        : undefined,
  ].filter(Boolean) as string[];

  for (const loc of locations) {
    if (loc && existsSync(loc)) {
      return loc;
    }
  }
  return undefined;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: Config;

  constructor(config: Partial<Config> = {}) {
    this.config = {
      browser: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        viewport: { width: 1920, height: 1080 },
        ...config.browser,
      },
      navigation: {
        waitUntil: 'networkidle2',
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
}
