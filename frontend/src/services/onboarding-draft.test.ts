import { beforeEach, describe, expect, it, vi } from "vitest";
import { claimPendingAnonymousDraft, getAnonymousDraft, preserveAnonymousDraft } from "./onboarding-draft";

const post = vi.fn();
vi.mock("@/lib/sdk", () => ({ sdk: { POST: post } }));

describe("anonymous affordability draft", () => {
  beforeEach(() => {
    window.localStorage.clear();
    post.mockReset();
  });

  it("preserves the draft until a claim succeeds", async () => {
    preserveAnonymousDraft("draft-token");
    post.mockResolvedValueOnce({ response: new Response(null, { status: 409 }) });

    await expect(claimPendingAnonymousDraft()).rejects.toThrow("Draft claim failed (409)");
    expect(getAnonymousDraft()).toBe("draft-token");

    post.mockResolvedValueOnce({ response: new Response(null, { status: 200 }) });
    await expect(claimPendingAnonymousDraft()).resolves.toBe(true);
    expect(getAnonymousDraft()).toBeNull();
    expect(post).toHaveBeenLastCalledWith("/api/v1/planning/drafts/{token}/claim", {
      params: { path: { token: "draft-token" } },
    });
  });
});
