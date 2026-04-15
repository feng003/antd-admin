import { transformPackageJsonName } from "./package-json-name.js";

export async function runTransforms(opts: {
  projectRoot: string;
  packageName: string;
  skip: boolean;
}): Promise<void> {
  if (opts.skip) return;
  transformPackageJsonName(opts.projectRoot, opts.packageName);
}
