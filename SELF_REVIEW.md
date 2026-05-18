# Self-Review: Architecture Decisions and Trade-Offs

This project was my attempt to design an AI system that is practical, extensible, and production-aware from day one. Instead of building a single large backend that does everything, I intentionally split responsibilities across multiple focused services. Looking back, that choice gave me strong long-term flexibility, but it also introduced complexity that I had to actively manage.

## Why I Chose a Multi-Agent Architecture

I separated the platform into four core services: planner backend, itinerary agent, weather agent, and location agent. The main reason was to keep each service accountable for one job.

- The planner backend validates and normalizes user intent.
- The itinerary agent orchestrates tool usage and response streaming.
- The weather agent transforms raw forecast/archive data into planning constraints.
- The location agent handles geocoding, POI retrieval, deduplication, and normalization.

### Trade-off

The biggest gain is modularity: I can improve one service without destabilizing others. The biggest cost is operational overhead: more services mean more deployment configuration, health checks, and inter-service failure handling.

I still believe this was the right decision. For an AI product that will evolve quickly, separation of concerns matters more than short-term implementation convenience.

## Why I Used Tool-Driven Orchestration for Itinerary Generation

I made the itinerary service the orchestrator and used tool-calling to gather weather/POI context before final generation. This was deliberate because pure prompt-based generation tends to produce generic plans unless grounded in structured external data.

### Trade-off

Tool-driven generation improves recommendation quality and explainability, but it increases latency and failure surface. If one downstream provider is slow or returns partial data, generation quality can degrade unless fallback behavior is carefully designed.

In practice, this trade-off is acceptable because users value relevant plans over ultra-fast but generic output. I prioritized quality and trust.

## Why I Added a RAG Layer Early

I integrated Qdrant to retrieve travel patterns and domain heuristics. I did this early because I wanted stable recommendation behavior across destinations and not rely only on transient model memory.

### Trade-off

RAG adds ingestion and retrieval complexity, and requires ongoing data curation to stay valuable. However, it gives me a controllable knowledge layer that can improve over time independently of model version changes.

The trade-off is worth it. Without retrieval, output quality is too dependent on model variability.

## Why I Streamed Results Over WebSocket

I used asynchronous job creation plus WebSocket streaming (`progress`, `chunk`, `complete`, `error`) instead of a synchronous request/response flow. This was specifically to improve user experience during long-running generation.

### Trade-off

Streaming improves perceived speed and transparency, but adds state management complexity (job lifecycle, reconnect logic, partial output handling). It also creates more front-end orchestration work.

I consider this a strong product decision because LLM workflows are rarely instant, and users should not wait behind a blank loading screen.

## Why I Kept Provider Abstraction in the Location Pipeline

The location service normalizes places from external APIs into a provider-agnostic schema and deduplicates/ranks outputs. I did this to reduce lock-in and to stabilize upstream changes from third-party providers.

### Trade-off

Normalization and ranking logic are non-trivial and require maintenance. But this layer protects downstream itinerary logic from provider-specific schema drift and inconsistent quality signals.

This decision reduced future integration risk and made the itinerary logic cleaner.

## Why I Invested in Behavior Tests for LLM Paths

I created black-box behavior tests covering positive, negative, edge, and adversarial scenarios across key API surfaces. I treated this as mandatory because LLM-heavy systems can regress silently even when types and unit tests pass.

### Trade-off

Behavior tests are slower and can be sensitive to environment setup, model variance, and external API reliability. They are not as deterministic as pure unit tests.

Even with that downside, they are essential for protecting user-facing quality and API contracts in this architecture.

## What I Would Improve Next

If I iterate further, I would focus on three technical improvements:

1. **Stronger resilience patterns** for partial provider failure (explicit fallback modes and quality scoring at response level).
2. **Better observability and SLOs** around tool-call latency, generation quality, and failure classes.
3. **Cost-aware orchestration** to optimize LLM + API usage without hurting itinerary quality.

## Overall Assessment

From an architecture perspective, I intentionally optimized for maintainability, explainability, and extensibility over short-term simplicity. The system is more complex than a monolith, but that complexity is purposeful and aligned with product direction. The design decisions I made created a stable base for future capabilities, while the identified trade-offs are known, manageable, and worth the value they unlock.
