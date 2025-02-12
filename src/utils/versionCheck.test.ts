/* eslint-disable max-lines-per-function */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateUpgradeMessage,
  fetchLatestVersion,
  getPackageInfo,
  checkForUpdates,
} from "./versionCheck.js";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { getSettingsDir } from "../settings/settings.js";

vi.mock("fs");
vi.mock("fs/promises");
vi.mock("../settings/settings.js");

describe("versionCheck", () => {
  describe("generateUpgradeMessage", () => {
    it("returns null when versions are the same", () => {
      expect(generateUpgradeMessage("1.0.0", "1.0.0", "test-package")).toBe(
        null
      );
    });

    it("returns upgrade message when versions differ", () => {
      const message = generateUpgradeMessage("1.0.0", "1.1.0", "test-package");
      expect(message).toContain("Update available: 1.0.0 → 1.1.0");
      expect(message).toContain("Run 'npm install -g test-package' to update");
    });

    it("returns null when current version is higher", () => {
      expect(generateUpgradeMessage("2.0.0", "1.0.0", "test-package")).toBe(
        null
      );
    });
  });

  describe("fetchLatestVersion", () => {
    const mockFetch = vi.fn();
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = mockFetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
      vi.clearAllMocks();
    });

    it("returns version when fetch succeeds", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: "1.1.0" }),
      });

      const version = await fetchLatestVersion("test-package");
      expect(version).toBe("1.1.0");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://registry.npmjs.org/test-package/latest"
      );
    });

    it("throws error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      await expect(fetchLatestVersion("test-package")).rejects.toThrow(
        "Failed to fetch version info: Not Found"
      );
    });

    it("throws error when version is missing from response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(fetchLatestVersion("test-package")).rejects.toThrow(
        "Version info not found in response"
      );
    });
  });

  describe("getPackageInfo", () => {
    it("returns package info from package.json", () => {
      const info = getPackageInfo();
      expect(info).toHaveProperty("name");
      expect(info).toHaveProperty("version");
      expect(typeof info.name).toBe("string");
      expect(typeof info.version).toBe("string");
    });
  });

  describe("checkForUpdates", () => {
    const mockFetch = vi.fn();
    const originalFetch = global.fetch;
    const mockSettingsDir = "/mock/settings/dir";
    const versionFilePath = path.join(mockSettingsDir, "lastVersionCheck");

    beforeEach(() => {
      global.fetch = mockFetch;
      vi.mocked(getSettingsDir).mockReturnValue(mockSettingsDir);
      vi.mocked(fs.existsSync).mockReturnValue(false);
    });

    afterEach(() => {
      global.fetch = originalFetch;
      vi.clearAllMocks();
    });

    it("returns null and initiates background check when no cached version", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: "2.0.0" }),
      });

      const result = await checkForUpdates();
      expect(result).toBe(null);

      // Wait for setImmediate to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockFetch).toHaveBeenCalled();
      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        versionFilePath,
        "2.0.0",
        "utf8"
      );
    });

    it("returns upgrade message when cached version is newer", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue("2.0.0");

      const result = await checkForUpdates();
      expect(result).toContain("Update available");
    });

    it("handles errors gracefully during version check", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockRejectedValue(new Error("Test error"));

      const result = await checkForUpdates();
      expect(result).toBe(null);
    });

    it("handles errors gracefully during background update", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await checkForUpdates();
      expect(result).toBe(null);

      // Wait for setImmediate to complete
      await new Promise((resolve) => setImmediate(resolve));

      // Verify the error was handled
      expect(fsPromises.writeFile).not.toHaveBeenCalled();
    });
  });
});
