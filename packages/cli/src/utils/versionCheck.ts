import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { createRequire } from 'module';
import * as path from 'path';

import chalk from 'chalk';
import { Logger, errorToString } from 'mycoder-agent';
import * as semver from 'semver';

import { getSettingsDir } from '../settings/settings.js';

import type { PackageJson } from 'type-fest';

const require = createRequire(import.meta.url);

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

export async function checkForUpdates(logger: Logger) {
  try {
    const { name: packageName, version: currentVersion } = getPackageInfo();

    logger.debug(`checkForUpdates: currentVersion: ${currentVersion}`);

    const settingDir = getSettingsDir();
    const versionFilePath = path.join(settingDir, 'lastVersionCheck');
    logger.debug(`checkForUpdates: versionFilePath: ${versionFilePath}`);

    fetchLatestVersion(packageName)
      .then(async (latestVersion) => {
        logger.debug(`checkForUpdates: latestVersion: ${latestVersion}`);
        return fsPromises.writeFile(versionFilePath, latestVersion, 'utf8');
      })
      .catch((error) => {
        logger.warn('Error fetching latest version:', errorToString(error));
      });

    if (fs.existsSync(versionFilePath)) {
      const lastVersionCheck = await fsPromises.readFile(
        versionFilePath,
        'utf8',
      );
      logger.debug(`checkForUpdates: lastVersionCheck: ${lastVersionCheck}`);
      const updateMessage = generateUpgradeMessage(
        currentVersion,
        lastVersionCheck,
        packageName,
      );
      if (updateMessage) {
        logger.info('\n' + updateMessage + '\n');
      }
    }
  } catch (error) {
    // Log error but don't throw to handle gracefully
    logger.warn('Error checking for updates:', errorToString(error));
  }
}
