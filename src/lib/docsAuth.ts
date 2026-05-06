const allowedDocsOrigins = new Set([
  "https://documentation.openclaw.ai",
  "https://docs.openclaw.ai",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

const productionDocsOrigin = "https://documentation.openclaw.ai";

export function normalizeDocsReturnTo(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!allowedDocsOrigins.has(url.origin)) return null;
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function buildDocsAuthCallbackUrl(returnTo: string) {
  const normalized = normalizeDocsReturnTo(returnTo);
  if (!normalized) return null;
  const url = new URL(normalized);
  const callbackOrigin =
    url.hostname === "localhost" || url.hostname === "127.0.0.1"
      ? url.origin
      : productionDocsOrigin;
  return `${callbackOrigin}/ask-molty/auth/callback`;
}
