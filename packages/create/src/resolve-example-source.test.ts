import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolveExampleSource } from "./resolve-example-source.js";

describe("resolveExampleSource", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves short example with default repo and env ref", () => {
    vi.stubEnv("CREATE_ANTD_ADMIN_REF", "main");
    const r = resolveExampleSource({ example: "basic" });
    expect(r.gigetSource).toBe("github:zuiidea/antd-admin/apps/basic#main");
  });

  it("passes through https URL", () => {
    const url = "https://api.github.com/repos/zuiidea/antd-admin/tarball/main";
    const r = resolveExampleSource({ example: url });
    expect(r.gigetSource).toBe(url);
  });
});
