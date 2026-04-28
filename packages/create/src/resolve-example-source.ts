import { DEFAULT_GITHUB_REPO, ENV_REPO } from "./constants.js";
import { CliError } from "./errors.js";
import { resolveGitRef } from "./resolve-ref.js";

export type ResolvedExampleSource = { gigetSource: string; displayName: string };

function defaultRepo(): string {
  return process.env[ENV_REPO]?.trim() || DEFAULT_GITHUB_REPO;
}

export function resolveExampleSource(input: {
  example?: string;
  examplePath?: string;
}): ResolvedExampleSource {
  const example = input.example?.trim();
  if (!example) {
    throw new CliError("example is required", "INVALID_INPUT");
  }
  const { examplePath } = input;
  const ref = resolveGitRef();

  if (/^https?:\/\//i.test(example)) {
    return { gigetSource: example, displayName: example };
  }

  const repo = defaultRepo();

  if (!example.includes("/")) {
    const sub = examplePath
      ? `apps/${example}/${examplePath}`.replace(/\/+/g, "/")
      : `apps/${example}`;
    const gigetSource = `github:${repo}/${sub}#${ref}`;
    return { gigetSource, displayName: example };
  }

  const pathPart = examplePath ? `${example}/${examplePath}` : example;
  const gigetSource = `github:${pathPart}#${ref}`;
  return { gigetSource, displayName: pathPart };
}
