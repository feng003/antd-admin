import fs from "node:fs";
import path from "node:path";
import { CliError } from "./errors.js";

export function resolveTargetRoot(cwd: string, dir: string): string {
  const abs = path.resolve(cwd, dir);
  if (fs.existsSync(abs)) {
    const entries = fs.readdirSync(abs);
    if (entries.length > 0) {
      throw new CliError(
        `Target directory is not empty: ${abs}`,
        "INVALID_INPUT"
      );
    }
  }
  return abs;
}
