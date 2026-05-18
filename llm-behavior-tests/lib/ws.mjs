// WebSocket helpers for the itinerary agent test suite.
// The itinerary agent emits plan progression events on
//   ws://<itinerary>/api/v1/ws?jobId=<uuid>
// These helpers wrap connect / wait-for-message / wait-for-close patterns
// with explicit timeouts so scenarios stay readable.

import WebSocket from "ws";

import { BASE_URLS, WS_PLAN_TIMEOUT_MS } from "./config.mjs";

/** Convert the itinerary HTTP base URL into a WS URL with `?jobId=`. */
export function buildPlanWsUrl(jobId, { path = "/ws" } = {}) {
  const httpUrl = new URL(BASE_URLS.itinerary);
  const wsProtocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = new URL(`${wsProtocol}//${httpUrl.host}${httpUrl.pathname}${path}`);
  if (jobId !== undefined && jobId !== null) {
    wsUrl.searchParams.set("jobId", String(jobId));
  }
  return wsUrl.toString();
}

/**
 * Connect to the plan WebSocket and resolve with the first received message
 * that satisfies `predicate`. Rejects if the socket closes without a match,
 * or if the timeout fires first.
 */
export function waitForPlanEvent(jobId, predicate, options = {}) {
  const timeoutMs = options.timeoutMs ?? WS_PLAN_TIMEOUT_MS;
  const url = options.url ?? buildPlanWsUrl(jobId);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.terminate();
      reject(new Error(`Timed out after ${timeoutMs}ms waiting for plan event`));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      try {
        ws.removeAllListeners();
      } catch {
        // socket may already be closed
      }
      ws.terminate();
    };

    ws.on("message", (raw) => {
      if (settled) return;
      let payload;
      try {
        payload = JSON.parse(raw.toString());
      } catch (err) {
        settled = true;
        cleanup();
        reject(new Error(`Unparseable WS message: ${err instanceof Error ? err.message : err}`));
        return;
      }
      if (predicate(payload)) {
        settled = true;
        cleanup();
        resolve(payload);
      }
    });

    ws.on("close", (code, reason) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(
        new Error(
          `WebSocket closed before predicate matched: code=${code}, reason=${reason?.toString?.() ?? ""}`,
        ),
      );
    });

    ws.on("error", (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    });
  });
}

/**
 * Open a WebSocket and resolve with `{ code, reason }` once it closes.
 * Used to verify negative scenarios (e.g. server rejects connection).
 */
export function waitForPlanWsClose(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 5_000;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.terminate();
      reject(new Error(`Timed out after ${timeoutMs}ms waiting for WS close`));
    }, timeoutMs);

    ws.on("close", (code, reason) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code, reason: reason?.toString?.() ?? "" });
    });

    ws.on("error", (err) => {
      // Some socket-level rejections surface only as `error` events; for
      // negative tests we treat the error itself as a successful close-like
      // signal so the caller can decide what to assert.
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code: -1, reason: err instanceof Error ? err.message : String(err) });
    });
  });
}
