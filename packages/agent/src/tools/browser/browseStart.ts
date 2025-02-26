import { chromium } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { Tool } from "../../core/types.js";
import { errorToString } from "../../utils/errorToString.js";

import { browserSessions } from "./types.js";

const parameterSchema = z.object({
  url: z.string().url().optional().describe("Initial URL to navigate to"),
  headless: z
    .boolean()
    .optional()
    .describe("Run browser in headless mode (default: true)"),
  timeout: z
    .number()
    .optional()
    .describe("Default timeout in milliseconds (default: 30000)"),
  description: z
    .string()
    .max(80)
    .describe("The reason for starting this browser session (max 80 chars)"),
});

const returnSchema = z.object({
  instanceId: z.string(),
  status: z.string(),
  content: z.string().optional(),
  error: z.string().optional(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const browseStartTool: Tool<Parameters, ReturnType> = {
  name: "browseStart",
  description: "Starts a new browser session with optional initial URL",
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),

  execute: async (
    { url, headless = true, timeout = 30000 },
    { logger },
  ): Promise<ReturnType> => {
    logger.verbose(`Starting browser session${url ? ` at ${url}` : ""}`);

    try {
      const instanceId = uuidv4();

      // Launch browser
      const browser = await chromium.launch({
        headless,
      });

      // Create new context with default settings
      const context = await browser.newContext({
        viewport: null,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      });

      // Create new page
      const page = await context.newPage();
      page.setDefaultTimeout(timeout);

      // Initialize browser session
      const session = {
        browser,
        page,
        id: instanceId,
      };

      browserSessions.set(instanceId, session);

      // Setup cleanup handlers
      browser.on("disconnected", () => {
        browserSessions.delete(instanceId);
      });

      // Navigate to URL if provided
      let content = "";
      if (url) {
        await page.goto(url, { waitUntil: "networkidle" });
        content = await page.content();
      }

      logger.verbose("Browser session started successfully");

      return {
        instanceId,
        status: "initialized",
        content: content || undefined,
      };
    } catch (error) {
      logger.error(`Failed to start browser: ${errorToString(error)}`);
      return {
        instanceId: "",
        status: "error",
        error: errorToString(error),
      };
    }
  },

  logParameters: ({ url, description }, { logger }) => {
    logger.info(
      `Starting browser session${url ? ` at ${url}` : ""}, ${description}`,
    );
  },

  logReturns: (output, { logger }) => {
    if (output.error) {
      logger.error(`Browser start failed: ${output.error}`);
    } else {
      logger.info(`Browser session started with ID: ${output.instanceId}`);
    }
  },
};
