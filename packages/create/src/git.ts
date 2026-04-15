import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function tryGitInit(root: string, enabled: boolean): boolean {
  if (!enabled) {
    const gitDir = path.join(root, ".git");
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }
    return false;
  }
  const init = spawnSync("git", ["init"], { cwd: root, stdio: "ignore" });
  if (init.status !== 0) return false;
  spawnSync("git", ["add", "-A"], { cwd: root, stdio: "ignore" });
  spawnSync(
    "git",
    ["commit", "-m", "chore: initial commit from create-antdadmin"],
    { cwd: root, stdio: "ignore" }
  );
  return true;
}
