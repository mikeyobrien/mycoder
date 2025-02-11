import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { BrowserManager } from "./browser-manager.js";
import { BrowserSession } from "./types.js";

describe("Element State Tests", () => {
  let browserManager: BrowserManager;
  let session: BrowserSession;
  const baseUrl = "https://the-internet.herokuapp.com";

  beforeAll(async () => {
    browserManager = new BrowserManager();
    session = await browserManager.createSession({ headless: true });
  });

  afterAll(async () => {
    await browserManager.closeAllSessions();
  });

  describe("Checkbox Tests", () => {
    beforeEach(async () => {
      await session.page.goto(`${baseUrl}/checkboxes`);
    });

    it("should verify initial checkbox states", async () => {
      const checkboxes = await session.page.$$('input[type="checkbox"]');
      expect(checkboxes).toHaveLength(2);

      const initialStates = await Promise.all(
        checkboxes.map((cb) =>
          cb.evaluate((el) => (el as HTMLInputElement).checked)
        )
      );
      expect(initialStates[0]).toBe(false);
      expect(initialStates[1]).toBe(true);
    });

    it("should toggle checkbox states", async () => {
      const checkboxes = await session.page.$$('input[type="checkbox"]');

      // Toggle first checkbox
      await checkboxes[0].click();
      let newState = await checkboxes[0].evaluate(
        (el) => (el as HTMLInputElement).checked
      );
      expect(newState).toBe(true);

      // Toggle second checkbox
      await checkboxes[1].click();
      newState = await checkboxes[1].evaluate(
        (el) => (el as HTMLInputElement).checked
      );
      expect(newState).toBe(false);
    });

    it("should maintain checkbox states after page refresh", async () => {
      const checkboxes = await session.page.$$('input[type="checkbox"]');
      await checkboxes[0].click(); // Toggle first checkbox

      await session.page.reload();

      const newCheckboxes = await session.page.$$('input[type="checkbox"]');
      const states = await Promise.all(
        newCheckboxes.map((cb) =>
          cb.evaluate((el) => (el as HTMLInputElement).checked)
        )
      );

      // After refresh, should return to default states
      expect(states[0]).toBe(false);
      expect(states[1]).toBe(true);
    });
  });

  describe("Dynamic Controls Tests", () => {
    beforeEach(async () => {
      await session.page.goto(`${baseUrl}/dynamic_controls`);
    });

    it("should handle enabled/disabled element states", async () => {
      const input = await session.page.$('input[type="text"]');
      const isInitiallyDisabled = await input?.evaluate(
        (el) => (el as HTMLInputElement).disabled
      );
      expect(isInitiallyDisabled).toBe(true);

      await session.page.click('button:has-text("Enable")'); 
      await session.page.waitForSelector('input:not([disabled])');

      const isEnabled = await input?.evaluate(
        (el) => !(el as HTMLInputElement).disabled
      );
      expect(isEnabled).toBe(true);
    });
  });
});