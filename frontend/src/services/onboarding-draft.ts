// The draft is intentionally opaque to auth: onboarding owns its format and
// can carry only a reference/token here until the claim endpoint is finalized.
const DRAFT_KEY = "fdp:anonymous-onboarding-draft";

export function preserveAnonymousDraft(value: string) {
  if (typeof window !== "undefined" && value) window.localStorage.setItem(DRAFT_KEY, value);
}

export function getAnonymousDraft() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(DRAFT_KEY);
}

export function clearAnonymousDraft() {
  if (typeof window !== "undefined") window.localStorage.removeItem(DRAFT_KEY);
}

export type AnonymousDraftClaimer = (opaqueDraft: string) => Promise<void>;

export async function claimPendingAnonymousDraft() {
  const draft = getAnonymousDraft();
  if (!draft) return false;
  const { sdk } = await import("@/lib/sdk");
  const result = await sdk.POST("/api/v1/planning/drafts/{token}/claim", { params: { path: { token: draft } } });
  if (!result.response.ok) throw new Error(`Draft claim failed (${result.response.status})`);
  clearAnonymousDraft();
  return true;
}

export async function claimAnonymousDraft(claimer: AnonymousDraftClaimer) {
  const draft = getAnonymousDraft();
  if (!draft) return false;
  await claimer(draft);
  clearAnonymousDraft();
  return true;
}
