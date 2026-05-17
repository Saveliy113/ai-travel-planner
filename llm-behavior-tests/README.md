# LLM Behavior Tests

Black-box integration tests for AI behavior and API contract checks across:

- `ai-travel-planner-be` (`/validation/destination`)
- `ai-location-agent` (`/location/interests`)
- `ai-itenerary-agent` (`/travel-plan/generate`)

Scenarios include:

- Positive scenarios (normal user flow)
- Negative scenarios (input validation failures)
- Edge cases (unicode, long prompt, boundary dates)
- Adversarial prompts (prompt injection style content)

## One Entry Point

Run all suites:

```bash
npm test --prefix llm-behavior-tests
```

Or run a single suite:

```bash
npm run test:positive --prefix llm-behavior-tests
npm run test:negative --prefix llm-behavior-tests
npm run test:edge --prefix llm-behavior-tests
npm run test:adversarial --prefix llm-behavior-tests
```

## Prerequisites

Start the services first (with working env vars and API keys), then run tests.

Default base URLs:

- Planner: `http://localhost:7016/api/v1`
- Location: `http://localhost:7019/api/v1`
- Itinerary: `http://localhost:7020/api/v1`

Override via env vars if needed:

```bash
BEHAVIOR_TEST_PLANNER_BASE_URL=http://localhost:7016/api/v1 \
BEHAVIOR_TEST_LOCATION_BASE_URL=http://localhost:7019/api/v1 \
BEHAVIOR_TEST_ITINERARY_BASE_URL=http://localhost:7020/api/v1 \
npm test --prefix llm-behavior-tests
```

Optional timeout override:

```bash
BEHAVIOR_TEST_TIMEOUT_MS=180000 npm test --prefix llm-behavior-tests
```
