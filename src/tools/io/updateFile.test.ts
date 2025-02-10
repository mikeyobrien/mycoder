/* eslint-disable max-lines-per-function */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "path";
import { randomUUID } from "crypto";
import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { Logger } from "../../utils/logger.js";
import { updateFileTool } from "./updateFile.js";
import { readFileTool } from "./readFile.js";
import { shellExecuteTool } from "../system/shellExecute.js";

const logger = new Logger({ name: "updateFile", logLevel: "warn" });

describe("updateFile", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "updatefile-test-"));
  });

  afterEach(async () => {
    await shellExecuteTool.execute(
      { command: `rm -rf "${testDir}"`, description: "test" },
      { logger },
    );
  });

  it("should rewrite a file's content", async () => {
    const testContent = "test content";
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create and rewrite the file
    const result = await updateFileTool.execute(
      {
        path: testPath,
        operation: {
          command: "rewrite",
          content: testContent,
        },
        description: "test",
      },
      { logger },
    );

    // Verify return value
    expect(result.path).toBe(testPath);
    expect(result.operation).toBe("rewrite");

    // Verify content
    const readResult = await readFileTool.execute(
      { path: testPath, description: "test" },
      { logger },
    );
    expect(readResult.content).toBe(testContent);
  });

  it("should append content to a file", async () => {
    const initialContent = "initial content\n";
    const appendContent = "appended content";
    const expectedContent = initialContent + appendContent;
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create initial file
    await updateFileTool.execute(
      {
        path: testPath,
        operation: {
          command: "rewrite",
          content: initialContent,
        },
        description: "test",
      },
      { logger },
    );

    // Append content
    const result = await updateFileTool.execute(
      {
        path: testPath,
        operation: {
          command: "append",
          content: appendContent,
        },
        description: "test",
      },
      { logger },
    );

    // Verify return value
    expect(result.path).toBe(testPath);
    expect(result.operation).toBe("append");

    // Verify content
    const readResult = await readFileTool.execute(
      { path: testPath, description: "test" },
      { logger },
    );
    expect(readResult.content).toBe(expectedContent);
  });

  it("should update specific text in a file", async () => {
    const initialContent = "Hello world! This is a test.";
    const oldStr = "world";
    const newStr = "universe";
    const expectedContent = "Hello universe! This is a test.";
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create initial file
    await updateFileTool.execute(
      {
        path: testPath,
        operation: {
          command: "rewrite",
          content: initialContent,
        },
        description: "test",
      },
      { logger },
    );

    // Update specific text
    const result = await updateFileTool.execute(
      {
        path: testPath,
        operation: {
          command: "update",
          oldStr,
          newStr,
        },
        description: "test",
      },
      { logger },
    );

    // Verify return value
    expect(result.path).toBe(testPath);
    expect(result.operation).toBe("update");

    // Verify content
    const readResult = await readFileTool.execute(
      { path: testPath, description: "test" },
      { logger },
    );
    expect(readResult.content).toBe(expectedContent);
  });

  it("should throw error when update finds multiple occurrences", async () => {
    const initialContent = "Hello world! This is a world test.";
    const oldStr = "world";
    const newStr = "universe";
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create initial file
    await updateFileTool.execute(
      {
        path: testPath,
        operation: {
          command: "rewrite",
          content: initialContent,
        },
        description: "test",
      },
      { logger },
    );

    // Attempt update that should fail
    await expect(
      updateFileTool.execute(
        {
          path: testPath,
          operation: {
            command: "update",
            oldStr,
            newStr,
          },
          description: "test",
        },
        { logger },
      ),
    ).rejects.toThrow("Found 2 occurrences of oldStr, expected exactly 1");
  });

  it("should create parent directories if they don't exist", async () => {
    const testContent = "test content";
    const nestedPath = join(testDir, "nested", "dir", `${randomUUID()}.txt`);

    // Create file in nested directory
    const result = await updateFileTool.execute(
      {
        path: nestedPath,
        operation: {
          command: "rewrite",
          content: testContent,
        },
        description: "test",
      },
      { logger },
    );

    // Verify return value
    expect(result.path).toBe(nestedPath);
    expect(result.operation).toBe("rewrite");

    // Verify content
    const readResult = await readFileTool.execute(
      { path: nestedPath, description: "test" },
      { logger },
    );
    expect(readResult.content).toBe(testContent);
  });
});
