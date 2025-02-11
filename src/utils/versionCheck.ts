import { Logger } from "./logger.js";
import chalk from "chalk";
import { createRequire } from "module";
import type { PackageJson } from "type-fest";

const require = createRequire(import.meta.url);
const logger = new Logger({ name: "version-check" });

/**
 * Gets the current package info from package.json
 */
export function getPackageInfo(): {
  name: string | undefined;
  version: string | undefined;
} {
  const packageInfo = require("../../package.json") as PackageJson;
  return {
    name: packageInfo.name,
    version: packageInfo.version,
  };
}

/**
 * Checks if the package is running as a global npm package
 */
export function isGlobalPackage(): boolean {
  return !!process.env.npm_config_global;
}

/**
 * Fetches the latest version of a package from npm registry
 */
export async function fetchLatestVersion(
  packageName: string,
): Promise<string | null> {
  try {
    const registryUrl = `https://registry.npmjs.org/${packageName}/latest`;
    const response = await fetch(registryUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch version info: ${response.statusText}`);
    }

    const data = (await response.json()) as { version: string | undefined };
    return data.version ?? null;
  } catch (error) {
    logger.warn(
      "Error fetching latest version:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Generates an upgrade message if versions differ
 */
export function generateUpgradeMessage(
  currentVersion: string,
  latestVersion: string,
  packageName: string,
): string | null {
  return currentVersion !== latestVersion
    ? chalk.green(
        `  Update available: ${currentVersion} → ${latestVersion}\n  Run 'npm install -g ${packageName}' to update`,
      )
    : null;
}

/**
 * Checks if a newer version of the package is available on npm.
 * Only runs check when package is installed globally.
 *
 * @returns Upgrade message string if update available, null otherwise
 */
export async function checkForUpdates(): Promise<string | null> {
  try {
    const { name: packageName, version: currentVersion } = getPackageInfo();

    if (!packageName || !currentVersion) {
      logger.warn("Unable to determine current package name or version");
      return null;
    }

    const latestVersion = await fetchLatestVersion(packageName);

    if (!latestVersion) {
      logger.warn("Unable to determine latest published version");
      return null;
    }

    return generateUpgradeMessage(currentVersion, latestVersion, packageName);
  } catch (error) {
    // Log error but don't throw to handle gracefully
    logger.warn(
      "Error checking for updates:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
