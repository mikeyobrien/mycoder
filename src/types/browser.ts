import { z } from 'zod';

export const BrowseStartSchema = z.object({
  headless: z.boolean().optional().default(true),
  description: z.string().max(80),
});

export type BrowseStartParams = z.infer<typeof BrowseStartSchema>;

export const SelectorTypeSchema = z.enum(['css', 'xpath']);

export const BrowseActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('navigate'),
    url: z.string().url(),
  }),
  z.object({
    action: z.literal('click'),
    selector: z.string(),
    selectorType: SelectorTypeSchema,
  }),
  z.object({
    action: z.literal('type'),
    selector: z.string(),
    selectorType: SelectorTypeSchema,
    text: z.string(),
  }),
]);

export const BrowseMessageSchema = z.object({
  instanceId: z.string(),
  description: z.string().max(80),
  action: BrowseActionSchema.optional(),
  takeScreenshot: z.boolean().optional().default(false),
  endSession: z.boolean().optional().default(false),
});

export type BrowseMessageParams = z.infer<typeof BrowseMessageSchema>;
