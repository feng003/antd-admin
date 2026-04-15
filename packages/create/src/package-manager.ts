import { spawnSync } from "node:child_process";

export type PackageManagerName = "npm" | "pnpm" | "yarn" | "bun";

const ORDER: PackageManagerName[] = ["pnpm", "npm", "yarn", "bun"];

export function isManagerAvailable(name: PackageManagerName): boolean {
  const result = spawnSync(name, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

export function detectAvailableManagers(): PackageManagerName[] {
  return ORDER.filter(isManagerAvailable);
}

/** Install argv; cwd is applied by install.ts via spawnSync `cwd` option. */
export function spawnInstall(name: PackageManagerName): {
  cmd: string;
  args: string[];
} {
  switch (name) {
    case "pnpm":
      return { cmd: "pnpm", args: ["install"] };
    case "npm":
      return { cmd: "npm", args: ["install"] };
    case "yarn":
      return { cmd: "yarn", args: ["install"] };
    case "bun":
      return { cmd: "bun", args: ["install"] };
    default: {
      const _: never = name;
      throw new Error(`unsupported manager ${_}`);
    }
  }
}
