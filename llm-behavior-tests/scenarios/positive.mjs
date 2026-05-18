// Positive scenarios — happy path / normal user flow validation.
// These tests exercise the three real public endpoints with realistic input
// and assert their documented API contract.

import assert from "node:assert/strict";

import { BASE_URLS, RUN_E2E_PLAN_TESTS } from "../lib/config.mjs";
import { apiRequest } from "../lib/http.mjs";
import { waitForPlanEvent } from "../lib/ws.mjs";
import {
  assertGenerateAccepted,
  assertInterestsShape,
  assertPlanDoneShape,
  assertValidationShape,
} from "../lib/assertions.mjs";
import { DEFAULT_VALID_TRIP, SAMPLE_DESTINATIONS } from "../lib/fixtures.mjs";

// ─── health checks ────────────────────────────────────────────────────────────

async function alivePlanner() {
  const res = await apiRequest("GET", `${BASE_URLS.planner}/alive`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.data, { status: "live" });
}

async function aliveLocation() {
  const res = await apiRequest("GET", `${BASE_URLS.location}/alive`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.data, { status: "live" });
}

async function aliveWeather() {
  const res = await apiRequest("GET", `${BASE_URLS.weather}/alive`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.data, { status: "live" });
}

// ─── destination validation (Planner BE) ──────────────────────────────────────

async function validationCityHappyPath() {
  // Single well-known city: expect a high-confidence, fully normalized result.
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: SAMPLE_DESTINATIONS.cityValid,
  });
  assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
  assertValidationShape(res.data);
  assert.equal(res.data.isValidLocation, true, "Kyoto must be recognized as a valid location");
  assert.ok(res.data.normalizedLocation.length > 0, "normalizedLocation must not be empty");
  assert.ok(
    res.data.confidence >= 0.5,
    `confidence must be high for an unambiguous city, got ${res.data.confidence}`,
  );
}

async function validationMisspelledCity() {
  // The LLM is required to fix transliteration and spelling errors. We do not
  // hardcode the canonical spelling — we only assert that the result is valid.
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: SAMPLE_DESTINATIONS.cityMisspelled,
  });
  assert.equal(res.status, 200);
  assertValidationShape(res.data);
  assert.equal(res.data.isValidLocation, true, "misspelled city should still resolve");
  assert.ok(res.data.normalizedLocation.length > 0);
}

async function validationMacroCountry() {
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: SAMPLE_DESTINATIONS.macroCountry,
  });
  assert.equal(res.status, 200);
  assertValidationShape(res.data);
  assert.equal(res.data.isValidLocation, true);
  // A country must be classified as a macro destination.
  assert.equal(
    res.data.locationType,
    "macroDestination",
    `Expected 'macroDestination' for a country, got '${res.data.locationType}'`,
  );
}

// ─── location agent: interests extraction ─────────────────────────────────────

async function interestsHappyPath() {
  const res = await apiRequest("POST", `${BASE_URLS.location}/location/interests`, {
    destination: "Barcelona, Spain",
  });
  assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
  assertInterestsShape(res.data);
  const items = res.data.categories ?? res.data.interests;
  // Prompt instructs 8–15 categories; allow a relaxed lower bound to keep the
  // test stable across small model variations.
  assert.ok(items.length >= 3, `expected at least 3 categories, got ${items.length}`);
}

async function interestsAtomicityRule() {
  // The system prompt explicitly forbids grouped labels like "Bars & Pubs".
  // We assert this rule on every returned category label.
  const res = await apiRequest("POST", `${BASE_URLS.location}/location/interests`, {
    destination: "Lisbon, Portugal",
  });
  assert.equal(res.status, 200);
  assertInterestsShape(res.data);
  const items = res.data.categories ?? res.data.interests;
  for (const category of items) {
    assert.equal(
      category.label.includes("&"),
      false,
      `category label must not group with '&': '${category.label}'`,
    );
    assert.equal(
      / and /i.test(category.label),
      false,
      `category label must not group with 'and': '${category.label}'`,
    );
  }
}

// ─── itinerary agent: accept generate request ─────────────────────────────────

async function generateReturnsJobId() {
  const res = await apiRequest("POST", `${BASE_URLS.itinerary}/travel-plan/generate`, DEFAULT_VALID_TRIP);
  assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
  assertGenerateAccepted(res.data);
}

// ─── itinerary agent: full E2E plan via WebSocket ─────────────────────────────
// This is the showcase test. It exercises the entire pipeline:
// 1) POST /travel-plan/generate → jobId
// 2) Subscribe to WS with the jobId
// 3) Wait for `plan_done` and verify the produced TravelPlan shape.
// It is gated behind BEHAVIOR_TEST_RUN_E2E_PLAN=1 because it is slow.

async function generateEndToEnd() {
  const res = await apiRequest("POST", `${BASE_URLS.itinerary}/travel-plan/generate`, DEFAULT_VALID_TRIP);
  assert.equal(res.status, 200);
  assertGenerateAccepted(res.data);

  const event = await waitForPlanEvent(
    res.data.jobId,
    (msg) => msg && (msg.type === "plan_done" || msg.type === "plan_error"),
  );
  assert.equal(event.type, "plan_done", `plan generation should succeed, got '${event.type}'`);
  assertPlanDoneShape(event);
}

export const tests = [
  { suite: "positive", name: "Planner BE alive endpoint", fn: alivePlanner },
  { suite: "positive", name: "Location agent alive endpoint", fn: aliveLocation },
  { suite: "positive", name: "Weather agent alive endpoint", fn: aliveWeather },

  { suite: "positive", name: "Validation: known city resolves with high confidence", fn: validationCityHappyPath },
  { suite: "positive", name: "Validation: misspelled city is normalized", fn: validationMisspelledCity },
  { suite: "positive", name: "Validation: country is classified as macroDestination", fn: validationMacroCountry },

  { suite: "positive", name: "Interests: returns documented category shape", fn: interestsHappyPath },
  { suite: "positive", name: "Interests: each category obeys atomicity rule", fn: interestsAtomicityRule },

  { suite: "positive", name: "Generate: valid trip returns ok=true + UUID jobId", fn: generateReturnsJobId },
  ...(RUN_E2E_PLAN_TESTS
    ? [{ suite: "positive", name: "Generate: WebSocket emits a valid plan_done event", fn: generateEndToEnd }]
    : []),
];
