import { chromium } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

import {
  BrowserConfig,
  BrowserSession,
  BrowserError,
  BrowserErrorCode,
} from "./types.js";

export class BrowserManager {
  private sessions: Map<string, BrowserSession> = new Map();
  private readonly defaultConfig: BrowserConfig = {
    headless: true,
    defaultTimeout: 30000,
  };

  async createSession(config?: BrowserConfig): Promise<BrowserSession> {
    try {
      const sessionConfig = { ...this.defaultConfig, ...config };
      const browser = await chromium.launch({
        headless: sessionConfig.headless,
      });

      // Create a new context (equivalent to Puppeteer's incognito context)
      const context = await browser.newContext({
        viewport: null,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      });

      const page = await context.newPage();
      page.setDefaultTimeout(sessionConfig.defaultTimeout ?? 1000);

      const session: BrowserSession = {
        browser,
        page,
        id: uuidv4(),
      };

      this.sessions.set(session.id, session);
      this.setupCleanup(session);

      return session;
    } catch (error) {
      throw new BrowserError(
        "Failed to create browser session",
        BrowserErrorCode.LAUNCH_FAILED,
        error,
      );
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new BrowserError(
        "Session not found",
        BrowserErrorCode.SESSION_ERROR,
      );
    }

    try {
      // In Playwright, we should close the context which will automatically close its pages
      await session.page.context().close();
      await session.browser.close();
      this.sessions.delete(sessionId);
    } catch (error) {
      throw new BrowserError(
        "Failed to close session",
        BrowserErrorCode.SESSION_ERROR,
        error,
      );
    }
  }

  private setupCleanup(session: BrowserSession): void {
    // Handle browser disconnection
    session.browser.on("disconnected", () => {
      this.sessions.delete(session.id);
    });

    // Handle process exit
    process.on("exit", () => {
      this.closeSession(session.id).catch(() => {});
    });

    // Handle unexpected errors
    process.on("uncaughtException", () => {
      this.closeSession(session.id).catch(() => {});
    });
  }

  async closeAllSessions(): Promise<void> {
    const closePromises = Array.from(this.sessions.keys()).map((sessionId) =>
      this.closeSession(sessionId).catch(() => {}),
    );
    await Promise.all(closePromises);
  }

  getSession(sessionId: string): BrowserSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new BrowserError(
        "Session not found",
        BrowserErrorCode.SESSION_ERROR,
      );
    }
    return session;
  }
}
