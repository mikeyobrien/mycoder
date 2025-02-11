import { Page } from "@playwright/test";
import { ScreenshotOptions, BrowserError, BrowserErrorCode } from "./types.js";

export class ScreenshotController {
  constructor(private page: Page) {}

  async takeFullPageScreenshot(
    options: ScreenshotOptions = {}
  ): Promise<Buffer> {
    try {
      return await this.page.screenshot({
        fullPage: true,
        type: options.type || "png",
        quality: options.type === "jpeg" ? options.quality : undefined,
        path: options.path,
      });
    } catch (error) {
      throw new BrowserError(
        `Failed to take full page screenshot: ${error}`,
        BrowserErrorCode.SCREENSHOT_FAILED,
        error
      );
    }
  }

  async takeElementScreenshot(
    selector: string,
    options: ScreenshotOptions = {}
  ): Promise<Buffer> {
    try {
      const element = this.page.locator(selector);
      return await element.screenshot({
        type: options.type || "png",
        quality: options.type === "jpeg" ? options.quality : undefined,
        path: options.path,
      });
    } catch (error) {
      throw new BrowserError(
        `Failed to take element screenshot: ${error}`,
        BrowserErrorCode.SCREENSHOT_FAILED,
        error
      );
    }
  }

  async takeViewportScreenshot(
    options: ScreenshotOptions = {}
  ): Promise<Buffer> {
    try {
      return await this.page.screenshot({
        fullPage: false,
        type: options.type || "png",
        quality: options.type === "jpeg" ? options.quality : undefined,
        path: options.path,
      });
    } catch (error) {
      throw new BrowserError(
        `Failed to take viewport screenshot: ${error}`,
        BrowserErrorCode.SCREENSHOT_FAILED,
        error
      );
    }
  }
}
