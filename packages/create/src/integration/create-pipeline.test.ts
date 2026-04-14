import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runTransforms } from "../transforms/run-transforms.js";

describe("create pipeline transforms", () => {
  it("renames package.json", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cad-"));
    const fixture = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../fixtures/minimal-app"
    );
    fs.cpSync(fixture, tmp, { recursive: true });
    await runTransforms({
      projectRoot: tmp,
      packageName: "my-fine-app",
      skip: false,
    });
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmp, "package.json"), "utf8")
    );
    expect(pkg.name).toBe("my-fine-app");
  });
});
