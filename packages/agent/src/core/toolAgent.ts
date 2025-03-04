/**
 * @fileoverview
 * This file has been refactored into a modular structure.
 * Please import from the toolAgent directory instead.
 */

import { toolAgent, ToolAgentResult } from './toolAgent/index.js';
import { Tool, ToolContext } from './toolAgent/types.js';

// Re-export the main toolAgent function and types for backward compatibility
export { toolAgent, ToolAgentResult, Tool, ToolContext };

// Provide a deprecation warning when this file is imported directly
const deprecationWarning = () => {
  console.warn(
    'Warning: Importing directly from toolAgent.ts is deprecated. ' +
    'Please import from the toolAgent directory instead.'
  );
};

// Call the deprecation warning when this module is loaded
deprecationWarning();
