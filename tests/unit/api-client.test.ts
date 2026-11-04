import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
describe("browser session bootstrap", () => {
  it("establishes one initial cookie and refreshes profile after identity changes", async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(async (path: string) => ({
        ok: true,
        status: 200,
        json: async () => ({ path }),
      }));
    vi.stubGlobal("fetch", fetcher);
    const { api } = await import("../../apps/web/src/lib/api");
    await Promise.all([
      api("/auth/me"),
      api("/dashboard/overview"),
      api("/assessments/blueprints"),
    ]);
    expect(
      fetcher.mock.calls.filter(([path]) => path === "/api/v1/auth/me"),
    ).toHaveLength(1);
    await api("/auth/me");
    expect(
      fetcher.mock.calls.filter(([path]) => path === "/api/v1/auth/me"),
    ).toHaveLength(2);
  });
});
