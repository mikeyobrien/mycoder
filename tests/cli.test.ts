import { expect, test, describe } from "vitest";
import { execSync } from "child_process";
import { version } from "../package.json";

describe("CLI", () => {
  test("version command outputs correct version", () => {
    const output = execSync("npx mycoder --version").toString();
    expect(output.trim()).toContain(version);
    expect(output.trim()).not.toContain("AI-powered coding assistant");
  });

  test("-h command outputs help", () => {
    const output = execSync("npx mycoder -h").toString();
    expect(output.trim()).toContain("Commands:");
    expect(output.trim()).toContain("Positionals:");
    expect(output.trim()).toContain("Options:");
  });
});
