import { BrowserManager } from "./browser-manager.js";
import { PageController } from "./page-controller.js";
import { ScreenshotController } from "./screenshot.js";

export class BrowserAutomation {
  private static instance: BrowserAutomation;
  private browserManager: BrowserManager;

  private constructor() {
    this.browserManager = new BrowserManager();
  }

  static getInstance(): BrowserAutomation {
    if (!BrowserAutomation.instance) {
      BrowserAutomation.instance = new BrowserAutomation();
    }
    return BrowserAutomation.instance;
  }

  async createSession(headless: boolean = false) {
    const session = await this.browserManager.createSession({ headless });
    const pageController = new PageController(session.page);
    const screenshotManager = new ScreenshotController(session.page);

    return {
      sessionId: session.id,
      pageController,
      screenshotManager,
      close: () => this.browserManager.closeSession(session.id),
    };
  }

  async cleanup() {
    await this.browserManager.closeAllSessions();
  }
}

// Export singleton instance
export const browserAutomation = BrowserAutomation.getInstance();
