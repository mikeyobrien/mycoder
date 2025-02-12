import { Logger } from './logger.js';
import chalk from 'chalk';
import { createRequire } from 'module';
import * as path from 'path';
import type { PackageJson } from 'type-fest';
import { getSettingsDir } from '../settings/settings.js';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as semver from 'semver';
import { errorToString } from './errorToString.js';

const require = createRequire(import.meta.url);
const logger = new Logger({ name: 'version-check' });

export function getPackageInfo(): {
  name: string;
  version: string;
} {
  const packageInfo = require('../../package.json') as PackageJson;
  if (!packageInfo.name || !packageInfo.version) {
    throw new Error('Unable to determine package info');
  }

  return {
    name: packageInfo.name,
    version: packageInfo.version,
  };
}

export async function fetchLatestVersion(packageName: string): Promise<string> {
  const registryUrl = `https://registry.npmjs.org/${packageName}/latest`;
  const response = await fetch(registryUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch version info: ${response.statusText}`);
  }

  const data = (await response.json()) as { version: string | undefined };
  if (!data.version) {
    throw new Error('Version info not found in response');
  }
  return data.version;
}

export function generateUpgradeMessage(
  currentVersion: string,
  latestVersion: string,
  packageName: string,
): string | null {
  return semver.gt(latestVersion, currentVersion)
    ? chalk.green(
        `  Update available: ${currentVersion} → ${latestVersion}\n  Run 'npm install -g ${packageName}' to update`,
      )
    : null;
}

export async function checkForUpdates(): Promise<string | null> {
  try {
    const { name: packageName, version: currentVersion } = getPackageInfo();

    const settingDir = getSettingsDir();
    const versionFilePath = path.join(settingDir, 'lastVersionCheck');
    if (fs.existsSync(versionFilePath)) {
      const lastVersionCheck = await fsPromises.readFile(
        versionFilePath,
        'utf8',
      );
      return generateUpgradeMessage(
        currentVersion,
        lastVersionCheck,
        packageName,
      );
    }

    fetchLatestVersion(packageName)
      .then(async (latestVersion) => {
        return fsPromises.writeFile(versionFilePath, latestVersion, 'utf8');
      })
      .catch((error) => {
        logger.warn('Error fetching latest version:', errorToString(error));
      });

    return null;
  } catch (error) {
    // Log error but don't throw to handle gracefully
    logger.warn('Error checking for updates:', errorToString(error));
    return null;
  }
}
