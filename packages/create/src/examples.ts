import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CliError } from "./errors.js";

export type ExamplesManifest = { examples: string[] };

export function loadExamplesManifest(): string[] {
  const manifestPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "examples.json"
  );
  if (!fs.existsSync(manifestPath)) {
    throw new CliError(
      `Missing ${manifestPath}. Run pnpm run build in packages/create.`,
      "INVALID_INPUT"
    );
  }
  const data = JSON.parse(
    fs.readFileSync(manifestPath, "utf8")
  ) as ExamplesManifest;
  if (!Array.isArray(data.examples) || data.examples.length === 0) {
    throw new CliError("Invalid examples.json", "INVALID_INPUT");
  }
  return data.examples;
}

export function assertValidExample(name: string, list: string[]): void {
  if (!list.includes(name)) {
    throw new CliError(
      `Unknown example "${name}". Valid: ${list.join(", ")}`,
      "INVALID_INPUT"
    );
  }
}
