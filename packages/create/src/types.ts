import type { PackageManagerName } from "./package-manager.js";

export type CreateCliOptions = {
  packageManager?: PackageManagerName;
  skipInstall: boolean;
  skipTransforms: boolean;
  example?: string;
  examplePath?: string;
  git: boolean;
};

export type CreateContext = {
  example: string;
  targetDir: string;
  packageName: string;
  packageManager: PackageManagerName;
};
