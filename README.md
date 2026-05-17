# AI Travel Planner — Local install & run

This repository contains a modular AI-powered travel planner composed of multiple services:
- Planner backend (validation / API)
- Itinerary agent (orchestrator / generator)
- Location agent (POI retrieval and normalization)
- Weather agent (forecast / archive)
- Ingest script (uploads travel patterns to Qdrant)
- Frontend SPA (Vite preview)
- Qdrant vector database

The provided Docker Compose config brings up Qdrant → ingest → the agents and backend → frontend.

## Requirements
- Docker (with Compose v2 support) installed on the host.
- Internet access for pulling Docker images and for the ingest script (OpenAI) and external APIs.

## Quick start

1. Clone the repository and cd in:

```bash
git clone <repo-url>
cd ai-travel-planner
```

2. Prepare API keys:
- The service URLs are already configured in the `*.env.production` files.
- Before running, replace only the API key placeholders with real keys.
- Do not commit real credentials. Keep them local or use a secret manager for production.

API keys to fill:
- `ingest/.env.production` — `OPENAI_API_KEY`
- `ai-travel-planner-be/.env.production` — `OPENAI_API_KEY`
- `ai-weather-agent/.env.production` — `OPENWEATHER_API_KEY`, `GOOGLE_MAPS_API_KEY`
- `ai-location-agent/.env.production` — `OPENAI_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_MAPS_API_KEY`
- `ai-itenerary-agent/.env.production` — `OPENAI_API_KEY`

You do not need to change Qdrant, MCP, backend, frontend, or Open-Meteo URLs for local Docker Compose usage.

3. Start everything:

```bash
docker compose up -d --build
```

Compose will start services in order: Qdrant → ingest → agents/backend → frontend. `ingest` is a one-shot service that will run and exit after uploading travel patterns.

4. Health checks
- Qdrant: http://localhost:6333  
- Planner BE: http://localhost:7016/api/v1/alive  
- Weather: http://localhost:7018/api/v1/alive  
- Location: http://localhost:7019/api/v1/alive  
- Itinerary: http://localhost:7020/api/v1/alive  
- Frontend (Vite preview): http://localhost:4173

5. Logs and debugging
- Tail logs: `docker compose logs -f <service>` (e.g. `ai-itenerary-agent`)  
- Restart a single service: `docker compose up -d --no-deps --build ai-itenerary-agent`  
- Full restart: `docker compose down && docker compose up -d --build`

## Common issues and troubleshooting

- ingest fails or exits with an error: check `ingest` logs and ensure `OPENAI_API_KEY` is set. To run upload manually:
  ```bash
  cd ingest
  npm install
  npm run upload:qdrant
  ```

- `Not connected` in itinerary agent / `Cannot POST /mcp` in logs: first check that the weather and location containers are running. The MCP URLs are already configured for Docker Compose, so this usually means a dependency failed to start or the itinerary agent needs to be rebuilt/restarted.

- WebSocket from the browser won't connect: the frontend should use `localhost`-based URLs (by default `ai-travel-planner-fe/.env.production` uses `localhost`). Browser clients cannot resolve container hostnames unless you use a reverse proxy or host DNS mapping.

- MCP (Model Context Protocol) uses dynamic npx-based transports in some agents; containers need network access at startup for those components to initialize.

## Security and CI recommendations
- Do not store real credentials in the repository. Provide a `*.env.production.example` with variable names and add real `*.env.production` to `.gitignore`.
- Use CI/CD secret storage for production deployments (GitHub Actions secrets, Vault, etc.).

## Useful commands
- See running containers: `docker compose ps`  
- Tail a service log: `docker compose logs --tail=200 ai-itenerary-agent`  
- Stop everything: `docker compose down`

## Next steps I can help with
- Create `env.production.example` and add `.env.production` to `.gitignore`.  
- Add a simple nginx reverse-proxy to `docker-compose.yml` so the frontend can request services using container hostnames from the browser.  
- Add a startup validation step to services that checks critical URLs and fails fast with clear messages.

