import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENV_REF } from "./constants.js";

/**
 * Priority: CREATE_ANTD_ADMIN_REF env → read sibling package.json version as `v${version}` → `main` on failure.
 * When bundled to dist/cli.js, ../package.json is packages/create/package.json.
 */
export function resolveGitRef(): string {
  const env = process.env[ENV_REF]?.trim();
  if (env) return env;

  try {
    const pkgPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "package.json"
    );
    const raw = fs.readFileSync(pkgPath, "utf8");
    const { version } = JSON.parse(raw) as { version: string };
    return `v${version}`;
  } catch {
    return "main";
  }
}
