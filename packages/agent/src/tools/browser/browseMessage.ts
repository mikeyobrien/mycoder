import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { errorToString } from '../../utils/errorToString.js';

import { browserSessions, type BrowserAction, SelectorType } from './types.js';

// Schema for browser action
const browserActionSchema = z
  .object({
    actionType: z.enum(['goto', 'click', 'type', 'wait', 'content', 'close']),
    url: z
      .string()
      .url()
      .optional()
      .describe('URL to navigate to if "goto" actionType'),
    selector: z
      .string()
      .optional()
      .describe('Selector to click if "click" actionType'),
    selectorType: z
      .nativeEnum(SelectorType)
      .optional()
      .describe('Type of selector if "click" actionType'),
    text: z
      .string()
      .optional()
      .describe(
        'Text to type if "type" actionType, for other actionType, this is ignored',
      ),
  })
  .describe('Browser action to perform');

// Main parameter schema
const parameterSchema = z.object({
  instanceId: z.string().describe('The ID returned by browseStart'),
  action: browserActionSchema,
  description: z
    .string()
    .max(80)
    .describe('The reason for this browser action (max 80 chars)'),
});

// Return schema
const returnSchema = z.object({
  status: z.string(),
  content: z.string().optional(),
  error: z.string().optional(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

// Helper function to handle selectors
const getSelector = (selector: string, type?: SelectorType): string => {
  switch (type) {
    case SelectorType.XPATH:
      return `xpath=${selector}`;
    case SelectorType.TEXT:
      return `text=${selector}`;
    default:
      return selector; // CSS selector is default
  }
};

export const browseMessageTool: Tool<Parameters, ReturnType> = {
  name: 'browseMessage',
  description: 'Performs actions in an active browser session',
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),

  execute: async ({ instanceId, action }, { logger }): Promise<ReturnType> => {
    logger.verbose(`Executing browser action: ${action.actionType}`);

    try {
      const session = browserSessions.get(instanceId);
      if (!session) {
        throw new Error(`No browser session found with ID ${instanceId}`);
      }

      const { page } = session;

      switch (action.actionType) {
        case 'goto': {
          if (!action.url) {
            throw new Error('URL required for goto action');
          }
          await page.goto(action.url, { waitUntil: 'networkidle' });
          const content = await page.content();
          logger.verbose('Navigation completed successfully');
          return { status: 'success', content };
        }

        case 'click': {
          if (!action.selector) {
            throw new Error('Selector required for click action');
          }
          const clickSelector = getSelector(
            action.selector,
            action.selectorType,
          );
          await page.click(clickSelector);
          const content = await page.content();
          logger.verbose(
            `Click action completed on selector: ${clickSelector}`,
          );
          return { status: 'success', content };
        }

        case 'type': {
          if (!action.selector || !action.text) {
            throw new Error('Selector and text required for type action');
          }
          const typeSelector = getSelector(
            action.selector,
            action.selectorType,
          );
          await page.fill(typeSelector, action.text);
          logger.verbose(`Type action completed on selector: ${typeSelector}`);
          return { status: 'success' };
        }

        case 'wait': {
          if (!action.selector) {
            throw new Error('Selector required for wait action');
          }
          const waitSelector = getSelector(
            action.selector,
            action.selectorType,
          );
          await page.waitForSelector(waitSelector);
          logger.verbose(`Wait action completed for selector: ${waitSelector}`);
          return { status: 'success' };
        }

        case 'content': {
          const content = await page.content();
          logger.verbose('Page content retrieved successfully');
          return { status: 'success', content };
        }

        case 'close': {
          await session.page.context().close();
          await session.browser.close();
          browserSessions.delete(instanceId);
          logger.verbose('Browser session closed successfully');
          return { status: 'closed' };
        }

        default: {
          throw new Error(
            `Unsupported action type: ${(action as BrowserAction).actionType}`,
          );
        }
      }
    } catch (error) {
      logger.error('Browser action failed:', { error });
      return {
        status: 'error',
        error: errorToString(error),
      };
    }
  },

  logParameters: ({ action, description }, { logger }) => {
    logger.info(
      `🏄 Performing browser action: ${action.actionType}, ${description}`,
    );
  },

  logReturns: (output, { logger }) => {
    if (output.error) {
      logger.error(`Browser action failed: ${output.error}`);
    } else {
      logger.info(`Browser action completed with status: ${output.status}`);
    }
  },
};
