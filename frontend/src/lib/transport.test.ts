import { afterEach, describe, expect, it, vi } from "vitest";
import { authCookieNames, safeReturnPath } from "@/constants/api";
import { api, coordinatedFetch, loginPathForLocation } from "@/lib/api";

describe("auth transport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = "__Host-csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });

  it("uses production-safe __Host cookie names", () => {
    expect(authCookieNames(true)).toEqual({
      access: "__Host-access_token",
      refresh: "__Host-refresh_token",
      csrf: "__Host-csrf_token",
    });
  });

  it("builds a same-origin login redirect without trusting an external destination", () => {
    expect(loginPathForLocation({ pathname: "/onboarding", search: "?step=2" } as Location))
      .toBe("/login?next=%2Fonboarding%3Fstep%3D2");
  });

  it("coordinates concurrent SDK refreshes and sends CSRF on logout", async () => {
    document.cookie = "csrf_token=test-csrf";
    const refresh = vi.spyOn(api, "post").mockResolvedValue({} as never);
    let calls = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      calls += 1;
      const request = input instanceof Request ? input : new Request(input);
      if (calls <= 2) return new Response(null, { status: 401 });
      if (request.method === "POST") expect(request.headers.get("x-csrf-token")).toBe("test-csrf");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const [first, second] = await Promise.all([
      coordinatedFetch("http://localhost:3000/api/v1/accounts", { method: "GET" }),
      coordinatedFetch("http://localhost:3000/api/v1/accounts", { method: "GET" }),
    ]);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const logout = await coordinatedFetch("http://localhost:3000/api/v1/auth/logout", { method: "POST" });
    expect(logout.ok).toBe(true);
    const logoutRequest = fetchMock.mock.calls.at(-1)?.[0] as Request;
    expect(logoutRequest.headers.get("x-csrf-token")).toBe("test-csrf");
  });

  it("does not retry a request when session refresh fails", async () => {
    window.history.pushState({}, "", "/login");
    vi.spyOn(api, "post").mockRejectedValue(new Error("refresh failed"));
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));

    await expect(coordinatedFetch("http://localhost:3000/api/v1/accounts")).rejects.toThrow("refresh failed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("supports production __Host-csrf_token cookie for non-GET requests", async () => {
    const cookieSpy = vi.spyOn(document, "cookie", "get").mockReturnValue("__Host-csrf_token=prod-csrf-secret");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const request = input instanceof Request ? input : new Request(input);
      expect(request.headers.get("x-csrf-token")).toBe("prod-csrf-secret");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const res = await coordinatedFetch("http://localhost:3000/api/v1/accounts", { method: "POST", body: "{}" });
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    cookieSpy.mockRestore();
  });

  it("validates return paths to prevent external redirects and auth loops", () => {
    expect(safeReturnPath("/dashboard/plan")).toBe("/dashboard/plan");
    expect(safeReturnPath("/onboarding?step=2")).toBe("/onboarding?step=2");
    expect(safeReturnPath("//evil.com")).toBe("/dashboard");
    expect(safeReturnPath("https://evil.com")).toBe("/dashboard");
    expect(safeReturnPath("/\\evil.com")).toBe("/dashboard");
    expect(safeReturnPath("/login")).toBe("/dashboard");
    expect(safeReturnPath("/register")).toBe("/dashboard");
    expect(safeReturnPath("/auth/callback")).toBe("/dashboard");
    expect(safeReturnPath(null)).toBe("/dashboard");
    expect(safeReturnPath(undefined)).toBe("/dashboard");
  });
});
