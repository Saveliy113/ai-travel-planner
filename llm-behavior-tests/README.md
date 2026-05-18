# LLM Behavior Tests

Black-box integration tests for the AI Travel Planner micro-services.

The suite covers normal user flows, input validation, edge cases and
adversarial prompts against three real endpoints:

| Service                | Endpoint under test                  |
| ---------------------- | ------------------------------------ |
| `ai-travel-planner-be` | `POST /api/v1/validation/destination` |
| `ai-location-agent`    | `POST /api/v1/location/interests`     |
| `ai-itenerary-agent`   | `POST /api/v1/travel-plan/generate` + WebSocket `/api/v1/ws` |

It also exercises the `/alive` health endpoints of the planner, location and
weather agents.

## Layout

```
llm-behavior-tests/
├── lib/
│   ├── config.mjs        # base URLs, timeouts, suite catalogue
│   ├── http.mjs          # fetch wrapper with timeouts
│   ├── ws.mjs            # WebSocket connect / wait helpers
│   ├── assertions.mjs    # response-shape & safety assertions
│   └── fixtures.mjs      # canonical valid trip + injection probes
├── scenarios/
│   ├── positive.mjs      # normal user flow validation
│   ├── negative.mjs      # DTO / transport rejection paths
│   ├── edge.mjs          # boundary inputs & unusual characters
│   └── adversarial.mjs   # prompt injection / jailbreak attempts
├── run.mjs               # CLI entry point
├── CASES.md              # case-by-case summary (RU)
├── package.json
└── README.md
```

## Suites

| Suite        | What it covers                                                          |
| ------------ | ----------------------------------------------------------------------- |
| positive     | Health endpoints + happy-path validation, interests, generate           |
| negative     | Empty body, missing/invalid fields, WS rejection                        |
| edge         | Unicode, very long input, multi-location, date boundaries, large arrays |
| adversarial  | Prompt injection, API-key extraction, jailbreak, HTML/script injection  |

The full E2E plan test (POST → WebSocket → `plan_done`) is gated behind a flag
because it triggers the full LLM pipeline and is slow / costly.

## Prerequisites

1. Start all services (planner BE, location agent, weather agent, itinerary
   agent, Qdrant, ingest) with valid API keys.
2. Install local dependencies:
   ```bash
   npm install --prefix llm-behavior-tests
   ```

## Running

```bash
# Everything except the slow end-to-end plan test
npm test --prefix llm-behavior-tests

# A single suite
npm run test:positive    --prefix llm-behavior-tests
npm run test:negative    --prefix llm-behavior-tests
npm run test:edge        --prefix llm-behavior-tests
npm run test:adversarial --prefix llm-behavior-tests

# Filter by name pattern
node llm-behavior-tests/run.mjs --grep "clarification"

# Stop on first failure
node llm-behavior-tests/run.mjs --bail

# Full pipeline (slow: starts the real plan generation and waits for plan_done)
npm run test:e2e --prefix llm-behavior-tests
```

## Configuration

All defaults are aimed at `docker-compose up` on localhost. Override via env
vars when running against a different deployment:

```bash
BEHAVIOR_TEST_PLANNER_BASE_URL=http://localhost:7016/api/v1 \
BEHAVIOR_TEST_LOCATION_BASE_URL=http://localhost:7019/api/v1 \
BEHAVIOR_TEST_ITINERARY_BASE_URL=http://localhost:7020/api/v1 \
BEHAVIOR_TEST_WEATHER_BASE_URL=http://localhost:7018/api/v1 \
BEHAVIOR_TEST_TIMEOUT_MS=180000 \
BEHAVIOR_TEST_WS_TIMEOUT_MS=600000 \
BEHAVIOR_TEST_RUN_E2E_PLAN=1 \
npm test --prefix llm-behavior-tests
```

## What "passing" means

Most positive tests assert structural contract (status code, JSON shape, type
of every documented field). The adversarial tests do **not** require the LLM
to refuse a request — that is not the agents' responsibility. They assert:

- The API contract still holds after the injection attempt.
- No known credential / policy tokens leak into the response body.
- Documented schema rules (e.g. atomic clarification options) survive the
  injection.

See `CASES.md` for a human-readable description of every scenario.
