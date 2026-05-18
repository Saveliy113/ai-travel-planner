// Thin fetch wrapper with timeouts and tolerant body parsing.
// Tests prefer `apiRequest` over plain fetch so timeout, abort and JSON
// parsing behave uniformly.

import { REQUEST_TIMEOUT_MS } from "./config.mjs";

/**
 * Perform a JSON HTTP request with an AbortController-based timeout.
 * Non-JSON responses are surfaced as `{ raw: "<text>" }` so the caller can
 * still inspect them in assertions.
 */
export async function apiRequest(method, url, body, options = {}) {
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;
    if (text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        // Endpoints may legitimately return plain text on misconfiguration;
        // keep the raw body so assertions can still describe the failure.
        data = { raw: text };
      }
    }

    return { status: res.status, ok: res.ok, data };
  } finally {
    clearTimeout(timer);
  }
}
