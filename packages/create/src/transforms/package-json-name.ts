import fs from "node:fs";
import path from "node:path";
import { CliError } from "../errors.js";

export function transformPackageJsonName(
  projectRoot: string,
  name: string
): void {
  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new CliError(`No package.json at ${pkgPath}`, "TRANSFORM_FAILED");
  }
  const raw = fs.readFileSync(pkgPath, "utf8");
  const json = JSON.parse(raw) as { name?: string };
  json.name = name;
  fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2) + "\n");
}
