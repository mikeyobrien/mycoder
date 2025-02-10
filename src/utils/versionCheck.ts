import { Logger } from "./logger.js";
import { createRequire } from "module";
import type { PackageJson } from "type-fest";

const require = createRequire(import.meta.url);
const packageInfo = require("../../package.json") as PackageJson;
const logger = new Logger({ name: "version-check" });

/**
 * Checks if a newer version of the package is available on npm.
 * Only runs check when package is installed globally.
 *
 * @returns Upgrade message string if update available, null otherwise
 */
export async function checkForUpdates(): Promise<string | null> {
  try {
    // Only check for updates if running as global package
    if (!process.env.npm_config_global) {
      return null;
    }

    const packageName = packageInfo.name;
    const currentVersion = packageInfo.version;

    if (!packageName || !currentVersion) {
      logger.warn("Unable to determine package name or version");
      return null;
    }

    // Fetch latest version from npm registry
    const registryUrl = `https://registry.npmjs.org/${packageName}/latest`;
    const response = await fetch(registryUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch version info: ${response.statusText}`);
    }

    const data = (await response.json()) as { version: string | undefined };
    const latestVersion = data.version;

    if (!latestVersion) {
      throw new Error("Unable to determine latest version");
    }

    // Compare versions
    if (currentVersion !== latestVersion) {
      return `Update available: ${currentVersion} → ${latestVersion}\nRun 'npm install -g ${packageName}' to update`;
    }

    return null;
  } catch (error) {
    // Log error but don't throw to handle gracefully
    logger.error(
      "Error checking for updates:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
