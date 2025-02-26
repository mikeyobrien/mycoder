import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const settingsDir = path.join(os.homedir(), '.mycoder');

export const getSettingsDir = (): string => {
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }
  return settingsDir;
};

const consentFile = path.join(settingsDir, 'consent.json');

export const hasUserConsented = (): boolean => {
  return fs.existsSync(consentFile);
};

export const saveUserConsent = (): void => {
  const timestamp = new Date().toISOString();
  const data = JSON.stringify({ timestamp }, null, 2);
  fs.writeFileSync(consentFile, data);
};
