import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateUpgradeMessage,
  fetchLatestVersion,
  getPackageInfo,
  checkForUpdates,
} from "./versionCheck.js";

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

    it("returns null when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      const version = await fetchLatestVersion("test-package");
      expect(version).toBe(null);
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
    const originalEnv = process.env;

    beforeEach(() => {
      global.fetch = mockFetch;
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      global.fetch = originalFetch;
      process.env = originalEnv;
      vi.clearAllMocks();
    });

    it("returns null when not running as global package", async () => {
      delete process.env.npm_config_global;
      const result = await checkForUpdates();
      expect(result).toBe(null);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns upgrade message when update available", async () => {
      process.env.npm_config_global = "true";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: "999.0.0" }), // Much higher version
      });

      const result = await checkForUpdates();
      expect(result).toContain("Update available");
    });
  });
});
