// Negative scenarios — DTO validation, missing/invalid input, transport
// errors. These tests guarantee that the framework rejects malformed input
// before it ever reaches the LLM, protecting cost and downstream safety.

import assert from "node:assert/strict";

import { BASE_URLS } from "../lib/config.mjs";
import { apiRequest } from "../lib/http.mjs";
import {
  assertHasValidationError,
  hasValidationErrorField,
} from "../lib/assertions.mjs";
import { buildTripPayload, DEFAULT_VALID_TRIP } from "../lib/fixtures.mjs";
import { buildPlanWsUrl, waitForPlanWsClose } from "../lib/ws.mjs";

// ─── Planner BE: /validation/destination ─────────────────────────────────────

async function plannerEmptyBody() {
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {});
  assert.equal(res.status, 400, `Expected 400, got ${res.status}`);
  assert.equal(res.data?.errMsg, "Empty request body");
}

async function plannerMissingDestination() {
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    notDestination: "Paris",
  });
  assert.equal(res.status, 422);
  assert.equal(res.data?.errMsg, "Validation failed");
  assertHasValidationError(res.data, "destination");
}

async function plannerEmptyStringDestination() {
  // `@IsNotEmpty` rejects '', null, undefined — confirm 422.
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: "",
  });
  assert.equal(res.status, 422);
  assertHasValidationError(res.data, "destination");
}

async function plannerNonStringDestination() {
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: 1337,
  });
  assert.equal(res.status, 422);
  assertHasValidationError(res.data, "destination");
}

// ─── Location agent: /location/interests ─────────────────────────────────────

async function locationEmptyBody() {
  const res = await apiRequest("POST", `${BASE_URLS.location}/location/interests`, {});
  assert.equal(res.status, 400);
  assert.equal(res.data?.errMsg, "Empty request body");
}

async function locationMissingDestination() {
  const res = await apiRequest("POST", `${BASE_URLS.location}/location/interests`, {
    region: "Europe",
  });
  assert.equal(res.status, 422);
  assertHasValidationError(res.data, "destination");
}

async function locationNonStringDestination() {
  const res = await apiRequest("POST", `${BASE_URLS.location}/location/interests`, {
    destination: 1337,
  });
  assert.equal(res.status, 422);
  assertHasValidationError(res.data, "destination");
}

// ─── Itinerary agent: /travel-plan/generate ──────────────────────────────────

async function generateEmptyBody() {
  const res = await apiRequest("POST", `${BASE_URLS.itinerary}/travel-plan/generate`, {});
  assert.equal(res.status, 400);
  assert.equal(res.data?.errMsg, "Empty request body");
}

async function generateMissingInterests() {
  const payload = { ...DEFAULT_VALID_TRIP };
  delete payload.interests;
  const res = await apiRequest("POST", `${BASE_URLS.itinerary}/travel-plan/generate`, payload);
  assert.equal(res.status, 422);
  assertHasValidationError(res.data, "interests");
}

async function generateEmptyInterestsArray() {
  // `@ArrayMinSize(1)` is the rule — verify it triggers.
  const res = await apiRequest(
    "POST",
    `${BASE_URLS.itinerary}/travel-plan/generate`,
    buildTripPayload({ interests: [] }),
  );
  assert.equal(res.status, 422);
  assertHasValidationError(res.data, "interests");
}

async function generateInterestMissingFields() {
  // Each interest must have label/type/google_places_query/description.
  // Missing nested fields surface under a nested path like `interests.0.label`.
  const res = await apiRequest(
    "POST",
    `${BASE_URLS.itinerary}/travel-plan/generate`,
    buildTripPayload({
      interests: [{ label: "Only label" }],
    }),
  );
  assert.equal(res.status, 422);
  // The middleware flattens nested errors under the parent property name.
  // We only require that the response mentions the `interests` path somewhere.
  const mentionsInterests =
    hasValidationErrorField(res.data, "interests") ||
    (res.data?.errors ?? []).some((e) => /^interests/.test(e.paramName));
  assert.ok(mentionsInterests, "expected interests-related validation error");
}

async function generateMissingDates() {
  const payload = { ...DEFAULT_VALID_TRIP };
  delete payload.startDate;
  delete payload.endDate;
  const res = await apiRequest("POST", `${BASE_URLS.itinerary}/travel-plan/generate`, payload);
  assert.equal(res.status, 422);
  assertHasValidationError(res.data, "startDate");
  assertHasValidationError(res.data, "endDate");
}

async function generateMissingBudget() {
  const payload = { ...DEFAULT_VALID_TRIP };
  delete payload.budget;
  const res = await apiRequest("POST", `${BASE_URLS.itinerary}/travel-plan/generate`, payload);
  assert.equal(res.status, 422);
  assertHasValidationError(res.data, "budget");
}

async function generateAdditionalPreferencesWrongType() {
  // `additionalPreferences` is optional but, if present, must be a string.
  const res = await apiRequest(
    "POST",
    `${BASE_URLS.itinerary}/travel-plan/generate`,
    buildTripPayload({ additionalPreferences: 1234 }),
  );
  assert.equal(res.status, 422);
  assertHasValidationError(res.data, "additionalPreferences");
}

// ─── Itinerary agent: WebSocket negative paths ───────────────────────────────

async function wsMissingJobId() {
  // The server closes the socket with policy code 1008 when `jobId` is absent.
  const url = buildPlanWsUrl(undefined);
  const { code, reason } = await waitForPlanWsClose(url);
  assert.equal(code, 1008, `expected WS close 1008, got ${code} (${reason})`);
}

async function wsWrongPath() {
  // Any path other than `/api/v1/ws` results in a destroyed socket (no
  // graceful close). The helper resolves with `code = -1` in that case.
  const wrongUrl = buildPlanWsUrl("some-id", { path: "/wrong" });
  const { code } = await waitForPlanWsClose(wrongUrl);
  assert.ok(
    code === -1 || code === 1006 || code >= 4000,
    `expected the server to refuse the upgrade, got code=${code}`,
  );
}

export const tests = [
  { suite: "negative", name: "Planner: empty body → 400", fn: plannerEmptyBody },
  { suite: "negative", name: "Planner: missing destination → 422", fn: plannerMissingDestination },
  { suite: "negative", name: "Planner: empty string destination → 422", fn: plannerEmptyStringDestination },
  { suite: "negative", name: "Planner: non-string destination → 422", fn: plannerNonStringDestination },

  { suite: "negative", name: "Location: empty body → 400", fn: locationEmptyBody },
  { suite: "negative", name: "Location: missing destination → 422", fn: locationMissingDestination },
  { suite: "negative", name: "Location: non-string destination → 422", fn: locationNonStringDestination },

  { suite: "negative", name: "Generate: empty body → 400", fn: generateEmptyBody },
  { suite: "negative", name: "Generate: missing interests → 422", fn: generateMissingInterests },
  { suite: "negative", name: "Generate: empty interests array → 422", fn: generateEmptyInterestsArray },
  { suite: "negative", name: "Generate: nested interest missing fields → 422", fn: generateInterestMissingFields },
  { suite: "negative", name: "Generate: missing startDate/endDate → 422", fn: generateMissingDates },
  { suite: "negative", name: "Generate: missing budget → 422", fn: generateMissingBudget },
  { suite: "negative", name: "Generate: additionalPreferences wrong type → 422", fn: generateAdditionalPreferencesWrongType },

  { suite: "negative", name: "WS: connect without jobId closes with code 1008", fn: wsMissingJobId },
  { suite: "negative", name: "WS: wrong path is refused by the upgrade handler", fn: wsWrongPath },
];
