import { confirm, input, select } from "@inquirer/prompts";
import type { PackageManagerName } from "./package-manager.js";
import { CliError } from "./errors.js";
import { normalizePackageName } from "./utils/normalize-package-name.js";

export async function promptExample(examples: string[]): Promise<string> {
  return select({
    message: "Which example do you want?",
    choices: examples.map((value) => ({ name: value, value })),
  });
}

export async function promptTargetDir(): Promise<string> {
  const raw = await input({
    message:
      "Project directory (relative path, or '.' for current directory)?",
    default: "my-antd-admin",
  });
  const dir = (raw.trim() || "my-antd-admin").replace(/\\/g, "/");
  if (dir === ".") {
    const ok = await confirm({
      message: "Scaffold into the current directory?",
      default: false,
    });
    if (!ok) {
      throw new CliError("Aborted.", "INVALID_INPUT");
    }
  }
  return dir;
}

export async function promptPackageName(defaultName: string): Promise<string> {
  const raw = await input({
    message: "npm package name for package.json?",
    default: defaultName,
    validate: (value) => {
      try {
        normalizePackageName(value);
        return true;
      } catch (e) {
        return e instanceof Error ? e.message : String(e);
      }
    },
  });
  return normalizePackageName(raw);
}

export async function promptPackageManager(
  available: PackageManagerName[]
): Promise<PackageManagerName> {
  if (available.length === 0) {
    throw new CliError(
      "No supported package manager found in PATH (pnpm, npm, yarn, bun).",
      "INVALID_INPUT"
    );
  }
  return select({
    message: "Which package manager do you want to use?",
    choices: available.map((value) => ({ name: value, value })),
  });
}
