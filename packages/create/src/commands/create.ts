import fsSync from "node:fs";
import path from "node:path";
import pc from "picocolors";
import { assertValidExample, loadExamplesManifest } from "../examples.js";
import { downloadExampleToTemp } from "../download.js";
import { installDependencies } from "../install.js";
import {
  detectAvailableManagers,
  type PackageManagerName,
} from "../package-manager.js";
import { resolveTargetRoot } from "../paths.js";
import {
  promptExample,
  promptPackageManager,
  promptPackageName,
  promptTargetDir,
} from "../prompts.js";
import { resolveExampleSource } from "../resolve-example-source.js";
import { tryGitInit } from "../git.js";
import { runTransforms } from "../transforms/run-transforms.js";

export async function runCreate(
  opts: Omit<import("../types.js").CreateCliOptions, "git"> & {
    projectDirectory?: string;
    git?: boolean;
  }
): Promise<void> {
  const cwd = process.cwd();
  const manifest = loadExamplesManifest();

  const exampleTrim = opts.example?.trim();
  const example = exampleTrim
    ? exampleTrim
    : await promptExample(manifest);

  if (!/^https?:\/\//i.test(example)) {
    assertValidExample(example, manifest);
  }

  const projectDirRaw = opts.projectDirectory?.trim();
  const projectDir = projectDirRaw
    ? projectDirRaw
    : await promptTargetDir();

  const targetRoot = resolveTargetRoot(cwd, projectDir);
  fsSync.mkdirSync(targetRoot, { recursive: true });

  const defaultPkgName =
    projectDir === "."
      ? (() => {
          const normalized = path
            .basename(cwd)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
          return normalized || "antd-admin-app";
        })()
      : path.basename(targetRoot);

  const packageName = await promptPackageName(defaultPkgName);

  const packageManager: PackageManagerName =
    opts.packageManager ??
    (await promptPackageManager(detectAvailableManagers()));

  if (opts.skipTransforms && opts.packageManager) {
    console.warn(
      pc.yellow(
        "--skip-transforms was used with an explicit package manager; package.json name may not be updated before install."
      )
    );
  }

  const { gigetSource } = resolveExampleSource({
    example,
    examplePath: opts.examplePath,
  });

  const tmp = await downloadExampleToTemp(gigetSource);
  try {
    fsSync.cpSync(tmp, targetRoot, { recursive: true, dereference: true });
  } finally {
    fsSync.rmSync(tmp, { recursive: true, force: true });
  }

  await runTransforms({
    projectRoot: targetRoot,
    packageName,
    skip: opts.skipTransforms,
  });

  if (!opts.skipInstall) {
    installDependencies(targetRoot, packageManager);
  }

  tryGitInit(targetRoot, opts.git !== false);

  console.log(pc.green(`Success! Project created at ${targetRoot}`));
}
