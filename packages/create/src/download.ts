import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { downloadTemplate } from "giget";
import { CliError } from "./errors.js";

export async function downloadExampleToTemp(
  gigetSource: string
): Promise<string> {
  const dir = path.join(os.tmpdir(), `create-antdadmin-${randomUUID()}`);
  try {
    const { dir: outDir } = await downloadTemplate(gigetSource, {
      dir,
      forceClean: true,
    });
    return outDir;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new CliError(
      `Failed to download template.\nSource: ${gigetSource}\n${msg}`,
      "DOWNLOAD_FAILED"
    );
  }
}
