import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command, Option } from "commander";
import pc from "picocolors";
import { runCreate } from "./commands/create.js";
import { EXIT_ERROR, EXIT_SIGINT } from "./constants.js";
import { CliError } from "./errors.js";

const pkg = JSON.parse(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../package.json"),
    "utf8"
  )
) as { version: string };

const program = new Command();

program
  .name("create-antd-admin")
  .description("Create an Antd Admin app from official examples")
  .version(pkg.version, "-v, --version")
  .argument("[project-directory]", "Directory for the new project")
  .option("-e, --example <name|url>", "Example name or template URL")
  .option("--example-path <path>", "Path inside repo when URL is ambiguous")
  .addOption(
    new Option("-m, --package-manager <pm>", "Package manager").choices([
      "npm",
      "yarn",
      "pnpm",
      "bun",
    ])
  )
  .option("--skip-install", "Skip installing dependencies", false)
  .option("--skip-transforms", "Skip code transforms", false)
  .option("--no-git", "Skip git repository initialization")
  .action(
    async (
      projectDirectory: string | undefined,
      cmdOpts: {
        example?: string;
        examplePath?: string;
        packageManager?: "npm" | "yarn" | "pnpm" | "bun";
        skipInstall?: boolean;
        skipTransforms?: boolean;
        git?: boolean;
      }
    ) => {
      try {
        await runCreate({
          projectDirectory,
          example: cmdOpts.example,
          examplePath: cmdOpts.examplePath,
          packageManager: cmdOpts.packageManager,
          skipInstall: Boolean(cmdOpts.skipInstall),
          skipTransforms: Boolean(cmdOpts.skipTransforms),
          git: cmdOpts.git !== false,
        });
      } catch (e) {
        if (e instanceof CliError) {
          console.error(pc.red(e.message));
          process.exit(e.exitCode);
        }
        console.error(e);
        process.exit(EXIT_ERROR);
      }
    }
  );

process.on("SIGINT", () => {
  process.exit(EXIT_SIGINT);
});

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exit(EXIT_ERROR);
});
