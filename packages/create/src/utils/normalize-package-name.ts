import { CliError } from "../errors.js";

/**
 * npm package name rules (simplified): lowercase, URL-safe, no leading dot, segments 1-214.
 */
export function normalizePackageName(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    throw new CliError("Project name cannot be empty", "INVALID_INPUT");
  }
  if (trimmed.startsWith(".") || trimmed.startsWith("_")) {
    throw new CliError(
      "Project name cannot start with . or _",
      "INVALID_INPUT"
    );
  }
  const safe = trimmed
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-._~]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!safe || safe.length > 214) {
    throw new CliError("Project name is invalid or too long", "INVALID_INPUT");
  }
  return safe;
}
