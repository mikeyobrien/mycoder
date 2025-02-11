import type { Browser, Page } from "@playwright/test";

// Browser configuration
export interface BrowserConfig {
  headless?: boolean;
  defaultTimeout?: number;
}

// Browser session
export interface BrowserSession {
  browser: Browser;
  page: Page;
  id: string;
}

// Browser error codes
export enum BrowserErrorCode {
  LAUNCH_FAILED = "LAUNCH_FAILED",
  NAVIGATION_FAILED = "NAVIGATION_FAILED",
  SESSION_ERROR = "SESSION_ERROR",
  SELECTOR_ERROR = "SELECTOR_ERROR",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
  SELECTOR_INVALID = "SELECTOR_INVALID",
  ELEMENT_NOT_FOUND = "ELEMENT_NOT_FOUND",
  SCREENSHOT_FAILED = "SCREENSHOT_FAILED",
}

// Browser error class
export class BrowserError extends Error {
  constructor(
    message: string,
    public code: BrowserErrorCode,
    public cause?: unknown
  ) {
    super(message);
    this.name = "BrowserError";
  }
}

// Selector types for element interaction
export enum SelectorType {
  CSS = "css",
  XPATH = "xpath",
  TEXT = "text",
  ROLE = "role",
  TESTID = "testid",
}

// Selector options
export interface SelectorOptions {
  type?: SelectorType;
  timeout?: number;
  visible?: boolean;
}

// Screenshot options
export interface ScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  type?: "png" | "jpeg";
  quality?: number;
  scale?: number;
}

// Global map to store browser sessions
export const browserSessions: Map<string, BrowserSession> = new Map();

// Browser action types
export type BrowserAction =
  | { type: "goto"; url: string }
  | { type: "click"; selector: string; selectorType?: SelectorType }
  | {
      type: "type";
      selector: string;
      text: string;
      selectorType?: SelectorType;
    }
  | { type: "wait"; selector: string; selectorType?: SelectorType }
  | { type: "screenshot"; options?: ScreenshotOptions }
  | { type: "content" }
  | { type: "close" };
