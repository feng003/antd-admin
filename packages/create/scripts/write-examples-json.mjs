import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const appsDir = path.join(repoRoot, "apps");
const outFile = path.resolve(__dirname, "../dist/examples.json");

const exclude = new Set(["docs"]);
const names = fs
  .readdirSync(appsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => !exclude.has(name))
  .sort();

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ examples: names }, null, 2));
console.log(`write-examples-json: wrote ${outFile}`, names);
