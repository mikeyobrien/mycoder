#!/usr/bin/env node
import { fileURLToPath } from "url";
import { dirname } from "path";
import { join } from "path";

const cliUrl = import.meta.url;
const distIndex = cliUrl.replace("bin/cli.js", "dist/index.js");

await import(distIndex);
