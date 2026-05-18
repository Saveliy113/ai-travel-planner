// Shared configuration for the LLM behavior test suite.
// Centralizes base URLs, timeouts and the supported suite catalogue so every
// scenario file consumes the same source of truth.

import process from "node:process";

export const BASE_URLS = Object.freeze({
  planner: process.env.BEHAVIOR_TEST_PLANNER_BASE_URL ?? "http://localhost:7016/api/v1",
  location: process.env.BEHAVIOR_TEST_LOCATION_BASE_URL ?? "http://localhost:7019/api/v1",
  itinerary: process.env.BEHAVIOR_TEST_ITINERARY_BASE_URL ?? "http://localhost:7020/api/v1",
  weather: process.env.BEHAVIOR_TEST_WEATHER_BASE_URL ?? "http://localhost:7018/api/v1",
});

// Timeout for any single HTTP request. Some endpoints invoke an LLM
// synchronously (validation/destination, location/interests), so this needs
// to be generous.
export const REQUEST_TIMEOUT_MS = Number(process.env.BEHAVIOR_TEST_TIMEOUT_MS ?? 120_000);

// End-to-end WebSocket timeout used when waiting for the itinerary agent to
// finish a full plan generation cycle (geocoding + weather + POI + LLM).
export const WS_PLAN_TIMEOUT_MS = Number(process.env.BEHAVIOR_TEST_WS_TIMEOUT_MS ?? 480_000);

// Short WebSocket timeout for negative scenarios where we expect either a
// quick close from the server or no message at all.
export const WS_SHORT_TIMEOUT_MS = 5_000;

export const SUITES = Object.freeze(["positive", "negative", "edge", "adversarial"]);

// Toggle for tests that drive the full LLM plan-generation pipeline; they are
// slow and consume credits, so they are gated behind an explicit env flag.
export const RUN_E2E_PLAN_TESTS = process.env.BEHAVIOR_TEST_RUN_E2E_PLAN === "1";
