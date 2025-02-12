import { z } from 'zod';

// Browser Types
export const BrowserTypeEnum = z.enum(['chromium', 'firefox', 'webkit']);
export type BrowserType = z.infer<typeof BrowserTypeEnum>;

export const BrowserActionEnum = z.enum(['navigate', 'click', 'type', 'end']);
export type BrowserAction = z.infer<typeof BrowserActionEnum>;

// browseStart interfaces and schemas
export interface BrowseStartOptions {
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  viewport?: {
    width: number;
    height: number;
  };
}

export const BrowseStartOptionsSchema = z.object({
  headless: z.boolean().optional(),
  slowMo: z.number().optional(),
  timeout: z.number().optional(),
  viewport: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});

export interface BrowseStartParams {
  browserType: BrowserType;
  options?: BrowseStartOptions;
  description: string;
}

export const BrowseStartParamsSchema = z.object({
  browserType: BrowserTypeEnum,
  options: BrowseStartOptionsSchema.optional(),
  description: z.string().max(80),
});

export interface BrowseStartResult {
  sessionId: string;
  success: boolean;
  error?: string;
}

// browseMessage interfaces and schemas
export interface BrowseMessageActionParams {
  navigate?: { url: string };
  click?: { selector: string };
  type?: {
    selector: string;
    text: string;
  };
  end?: boolean;
}

export const BrowseMessageActionParamsSchema = z.object({
  navigate: z.object({ url: z.string().url() }).optional(),
  click: z.object({ selector: z.string() }).optional(),
  type: z
    .object({
      selector: z.string(),
      text: z.string(),
    })
    .optional(),
  end: z.boolean().optional(),
});

export interface BrowseMessageParams {
  sessionId: string;
  action: BrowserAction;
  actionParams: BrowseMessageActionParams;
  description: string;
}

export const BrowseMessageParamsSchema = z.object({
  sessionId: z.string(),
  action: BrowserActionEnum,
  actionParams: BrowseMessageActionParamsSchema,
  description: z.string().max(80),
});

export interface BrowseMessageResult {
  success: boolean;
  content?: string;
  consoleLogs?: string[];
  error?: string;
}
