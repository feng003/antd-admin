import { spawnSync } from "node:child_process";
import type { PackageManagerName } from "./package-manager.js";
import { spawnInstall } from "./package-manager.js";
import { CliError } from "./errors.js";

export function installDependencies(
  cwd: string,
  manager: PackageManagerName
): void {
  const { cmd, args } = spawnInstall(manager);
  const res = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, CI: "1" },
  });
  if (res.error || res.status !== 0) {
    throw new CliError(
      `${cmd} ${args.join(" ")} failed in ${cwd}`,
      "INSTALL_FAILED"
    );
  }
}
