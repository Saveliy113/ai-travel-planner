// Edge case scenarios — boundary inputs, unusual characters, ambiguous
// destinations, and other "weird but legal" requests. These confirm that the
// system stays well-defined at the limits of its contract instead of failing
// in surprising ways.

import assert from "node:assert/strict";

import { BASE_URLS } from "../lib/config.mjs";
import { apiRequest } from "../lib/http.mjs";
import {
  assertClarificationOptionsAreAtomic,
  assertGenerateAccepted,
  assertInterestsShape,
  assertValidationShape,
} from "../lib/assertions.mjs";
import { buildTripPayload, SAMPLE_DESTINATIONS } from "../lib/fixtures.mjs";

// ─── Planner BE edge cases ───────────────────────────────────────────────────

async function validationUnicodeAndWhitespace() {
  // Mixed Latin + CJK + irregular spacing. The service must trim and resolve.
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: SAMPLE_DESTINATIONS.cityNonLatin,
  });
  assert.equal(res.status, 200);
  assertValidationShape(res.data);
  assert.ok(res.data.normalizedLocation.length > 0);
}

async function validationVeryLongPrompt() {
  // A 3kB+ destination string should be either accepted (200) or rejected by
  // the framework (4xx). It must never crash the process (5xx outside of LLM
  // hiccups is also acceptable but logged).
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: SAMPLE_DESTINATIONS.longPrompt,
  });
  assert.ok([200, 422, 500].includes(res.status), `unexpected status ${res.status}`);
  if (res.status === 200) {
    assertValidationShape(res.data);
  }
}

async function validationMultipleUnrelatedDestinations() {
  // The prompt mandates `containsMultipleLocations: true` for unrelated input.
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: SAMPLE_DESTINATIONS.multipleUnrelated,
  });
  assert.equal(res.status, 200);
  assertValidationShape(res.data);
  assert.equal(
    res.data.containsMultipleLocations,
    true,
    "unrelated destinations must set containsMultipleLocations=true",
  );
}

async function validationClusterAtomicClarification() {
  // Phuket is the prompt's canonical clusterDestination example. When the LLM
  // requests clarification, every option must be an atomic single sub-location
  // (no "Kata & Karon"-style grouped labels).
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: SAMPLE_DESTINATIONS.clusterIsland,
  });
  assert.equal(res.status, 200);
  assertValidationShape(res.data);
  if (res.data.clarificationRequired) {
    assert.ok(
      res.data.clarificationOptions.length > 0,
      "clarificationRequired=true implies non-empty clarificationOptions",
    );
    assertClarificationOptionsAreAtomic(res.data.clarificationOptions);
  }
}

async function validationNumericOnly() {
  // A purely numeric string is not a real destination. The LLM is allowed to
  // mark it invalid; whatever it does, the response shape must hold.
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: SAMPLE_DESTINATIONS.numericOnly,
  });
  assert.equal(res.status, 200);
  assertValidationShape(res.data);
}

async function validationSingleChar() {
  const res = await apiRequest("POST", `${BASE_URLS.planner}/validation/destination`, {
    destination: SAMPLE_DESTINATIONS.singleChar,
  });
  assert.equal(res.status, 200);
  assertValidationShape(res.data);
}

// ─── Location agent edge cases ───────────────────────────────────────────────

async function interestsUnicodeDestination() {
  const res = await apiRequest("POST", `${BASE_URLS.location}/location/interests`, {
    destination: "Kraków, Polska",
  });
  assert.equal(res.status, 200);
  assertInterestsShape(res.data);
}

async function interestsClusterDestination() {
  // The location agent should still produce categories for cluster locations.
  const res = await apiRequest("POST", `${BASE_URLS.location}/location/interests`, {
    destination: "Bali, Indonesia",
  });
  assert.equal(res.status, 200);
  assertInterestsShape(res.data);
}

// ─── Itinerary agent edge cases ──────────────────────────────────────────────

async function generateSameDayTrip() {
  // startDate == endDate is structurally valid input (0 travel days).
  // The agent must accept the payload at the DTO layer; downstream LLM logic
  // is not part of the immediate response.
  const res = await apiRequest(
    "POST",
    `${BASE_URLS.itinerary}/travel-plan/generate`,
    buildTripPayload({ startDate: "2026-09-10", endDate: "2026-09-10" }),
  );
  assert.equal(res.status, 200);
  assertGenerateAccepted(res.data);
}

async function generateBoundaryDateRange() {
  // Month-end → month-start boundary. Common source of off-by-one bugs.
  const res = await apiRequest(
    "POST",
    `${BASE_URLS.itinerary}/travel-plan/generate`,
    buildTripPayload({ startDate: "2026-02-28", endDate: "2026-03-01" }),
  );
  assert.equal(res.status, 200);
  assertGenerateAccepted(res.data);
}

async function generateCrossYearBoundary() {
  // Year boundary should also be accepted without special handling.
  const res = await apiRequest(
    "POST",
    `${BASE_URLS.itinerary}/travel-plan/generate`,
    buildTripPayload({ startDate: "2026-12-30", endDate: "2027-01-02" }),
  );
  assert.equal(res.status, 200);
  assertGenerateAccepted(res.data);
}

async function generateManyInterests() {
  // Stress the nested validation with several interest items.
  const manyInterests = Array.from({ length: 6 }, (_, i) => ({
    label: `Interest ${i + 1}`,
    type: `type_${i + 1}`,
    google_places_query: `tourist_attraction_${i + 1}`,
    description: `Auto-generated interest #${i + 1} for stress testing`,
  }));
  const res = await apiRequest(
    "POST",
    `${BASE_URLS.itinerary}/travel-plan/generate`,
    buildTripPayload({ interests: manyInterests }),
  );
  assert.equal(res.status, 200);
  assertGenerateAccepted(res.data);
}

async function generateLargeAdditionalPreferences() {
  // Free-form long text. As long as it is a string, it must be accepted.
  const longText = "I love quiet cafes and rainy days. ".repeat(200);
  const res = await apiRequest(
    "POST",
    `${BASE_URLS.itinerary}/travel-plan/generate`,
    buildTripPayload({ additionalPreferences: longText }),
  );
  assert.equal(res.status, 200);
  assertGenerateAccepted(res.data);
}

export const tests = [
  { suite: "edge", name: "Validation: unicode + irregular whitespace", fn: validationUnicodeAndWhitespace },
  { suite: "edge", name: "Validation: very long destination string", fn: validationVeryLongPrompt },
  { suite: "edge", name: "Validation: multiple unrelated destinations flagged", fn: validationMultipleUnrelatedDestinations },
  { suite: "edge", name: "Validation: cluster clarification options stay atomic", fn: validationClusterAtomicClarification },
  { suite: "edge", name: "Validation: numeric-only input is handled gracefully", fn: validationNumericOnly },
  { suite: "edge", name: "Validation: single character input is handled gracefully", fn: validationSingleChar },

  { suite: "edge", name: "Interests: unicode destination resolves", fn: interestsUnicodeDestination },
  { suite: "edge", name: "Interests: cluster destination produces categories", fn: interestsClusterDestination },

  { suite: "edge", name: "Generate: same-day trip is accepted", fn: generateSameDayTrip },
  { suite: "edge", name: "Generate: month boundary date range is accepted", fn: generateBoundaryDateRange },
  { suite: "edge", name: "Generate: cross-year date range is accepted", fn: generateCrossYearBoundary },
  { suite: "edge", name: "Generate: many interests are accepted", fn: generateManyInterests },
  { suite: "edge", name: "Generate: very long additionalPreferences is accepted", fn: generateLargeAdditionalPreferences },
];
