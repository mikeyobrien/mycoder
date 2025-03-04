import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { getSettingsDir } from './settings.js';

const configFile = path.join(getSettingsDir(), 'config.json');

// Default configuration
const defaultConfig = {
  // Add default configuration values here
  githubMode: false,
};

export type Config = typeof defaultConfig;

export const getConfig = (): Config => {
  if (!fs.existsSync(configFile)) {
    return defaultConfig;
  }
  try {
    return JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  } catch (error) {
    return defaultConfig;
  }
};

export const updateConfig = (config: Partial<Config>): Config => {
  const currentConfig = getConfig();
  const updatedConfig = { ...currentConfig, ...config };
  fs.writeFileSync(configFile, JSON.stringify(updatedConfig, null, 2));
  return updatedConfig;
};
