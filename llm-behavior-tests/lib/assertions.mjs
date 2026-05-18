// Response-shape assertions shared across scenarios.
// LLM-driven endpoints can wobble in content, but the structural contract
// (field names, types, status codes) is stable — this module enforces it.

import assert from "node:assert/strict";

/** UUID v4 pattern accepted from `randomUUID` (lowercase hex). */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Known low-signal tokens we never want to see leaked back to the client. */
const FORBIDDEN_LEAK_TOKENS = [
  "openai_api_key",
  "google_places_api_key",
  "google_maps_api_key",
  "openweather_api_key",
  "process.env",
  "system prompt",
  "chain-of-thought",
  "sk-proj-",
  "sk-live-",
];

/** Verify `DestinationValidationResult` field structure returned by Planner BE. */
export function assertValidationShape(payload) {
  assert.equal(typeof payload, "object", "payload must be an object");
  assert.equal(typeof payload.isValidLocation, "boolean", "isValidLocation must be boolean");
  assert.equal(typeof payload.normalizedLocation, "string", "normalizedLocation must be string");
  assert.equal(typeof payload.locationType, "string", "locationType must be string");
  assert.equal(typeof payload.containsMultipleLocations, "boolean", "containsMultipleLocations must be boolean");
  assert.equal(typeof payload.ambiguityDetected, "boolean", "ambiguityDetected must be boolean");
  assert.equal(typeof payload.clarificationRequired, "boolean", "clarificationRequired must be boolean");
  assert.equal(typeof payload.clarificationReason, "string", "clarificationReason must be string");
  assert.ok(Array.isArray(payload.clarificationOptions), "clarificationOptions must be array");
  assert.equal(typeof payload.confidence, "number", "confidence must be number");
  assert.ok(
    payload.confidence >= 0 && payload.confidence <= 1,
    `confidence must be in [0,1], got ${payload.confidence}`,
  );
}

/**
 * Verify the location agent `interests` response.
 * Supports both the documented `categories[]` shape and the legacy
 * `interests[]` shape so this stays robust against minor LLM drift.
 */
export function assertInterestsShape(payload) {
  assert.equal(typeof payload, "object", "payload must be an object");
  const items = Array.isArray(payload.categories)
    ? payload.categories
    : Array.isArray(payload.interests)
      ? payload.interests
      : null;
  assert.ok(Array.isArray(items), "expected categories[] or interests[] in response");
  assert.ok(items.length >= 1, "categories[] must contain at least one category");

  for (const category of items) {
    assert.equal(typeof category, "object", "each category must be an object");
    assert.equal(typeof category.label, "string", "category.label must be string");
    assert.equal(typeof category.description, "string", "category.description must be string");
    const hasSearchQuery = typeof category.searchQuery === "string";
    const hasGoogleQuery = typeof category.google_places_query === "string";
    assert.ok(
      hasSearchQuery || hasGoogleQuery,
      "each category must define searchQuery or google_places_query",
    );
  }
}

/** Verify the immediate accepted response of POST /travel-plan/generate. */
export function assertGenerateAccepted(payload) {
  assert.equal(typeof payload, "object", "payload must be an object");
  assert.equal(payload.ok, true, "payload.ok must be true");
  assert.equal(typeof payload.jobId, "string", "jobId must be a string");
  assert.ok(UUID_V4.test(payload.jobId), `jobId must be a UUID v4, got '${payload.jobId}'`);
}

/** Walk the standard `errors[]` array produced by validateDto middleware. */
export function hasValidationErrorField(payload, fieldName) {
  if (!payload || !Array.isArray(payload.errors)) return false;
  return payload.errors.some((e) => e && e.paramName === fieldName);
}

/** Assert a specific field appears in the validation error list. */
export function assertHasValidationError(payload, fieldName) {
  assert.ok(
    hasValidationErrorField(payload, fieldName),
    `expected validation error for '${fieldName}', got ${JSON.stringify(payload?.errors)}`,
  );
}

/**
 * Assert the response body does not contain any of the well-known
 * credential / policy leakage tokens. Case-insensitive substring match.
 */
export function assertNoSecretsLeaked(payload, extraTokens = []) {
  const haystack = JSON.stringify(payload ?? "").toLowerCase();
  const tokens = [...FORBIDDEN_LEAK_TOKENS, ...extraTokens.map((t) => t.toLowerCase())];
  for (const token of tokens) {
    assert.equal(
      haystack.includes(token),
      false,
      `forbidden token '${token}' leaked into response`,
    );
  }
}

/**
 * Verify the `plan_done` payload from the itinerary WebSocket.
 * We do a structural check only — content is LLM-generated and may vary.
 */
export function assertPlanDoneShape(payload) {
  assert.equal(typeof payload, "object", "plan_done payload must be an object");
  assert.equal(payload.type, "plan_done", "type must be 'plan_done'");
  assert.equal(typeof payload.jobId, "string", "jobId must be a string");
  assert.equal(typeof payload.plan, "object", "plan must be an object");
  assert.ok(payload.plan !== null, "plan must not be null");
  assert.equal(typeof payload.plan.destination, "string", "plan.destination must be string");
  assert.ok(Array.isArray(payload.plan.days), "plan.days must be an array");
  assert.ok(payload.plan.days.length >= 1, "plan.days must contain at least one day");
}

/**
 * Atomicity check for clarification options as documented in the destination
 * validation prompt: each option must represent a single distinct sub-location,
 * never a grouped label ("Kata & Karon", "A and B", etc.).
 */
export function assertClarificationOptionsAreAtomic(options) {
  for (const option of options ?? []) {
    const name = String(option?.name ?? "");
    assert.equal(name.includes(" & "), false, `clarification option must not group with '&': '${name}'`);
    assert.equal(
      / and /i.test(name),
      false,
      `clarification option must not group with 'and': '${name}'`,
    );
    assert.equal(name.includes("/"), false, `clarification option must not group with '/': '${name}'`);
  }
}
