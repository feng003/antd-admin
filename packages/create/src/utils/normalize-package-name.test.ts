import { describe, expect, it } from "vitest";
import { normalizePackageName } from "./normalize-package-name.js";

describe("normalizePackageName", () => {
  it("lowercases and replaces spaces", () => {
    expect(normalizePackageName("My App")).toBe("my-app");
  });

  it("rejects leading dot", () => {
    expect(() => normalizePackageName(".bad")).toThrow(/cannot start/);
  });
});
