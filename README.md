# fuseproxy

A lightweight, observable proxy for Anthropic's `POST /v1/messages` API.

`fuseproxy` sits between your internal clients and Anthropic, validates inbound requests, forwards them to Anthropic, and emits tracing + generation telemetry to Langfuse via OpenTelemetry.

## What It Does

- Exposes `POST /v1/messages` on `http://localhost:5678`
- Requires bearer auth using an internal API key (`INTERNAL_API_KEY`)
- Validates request bodies with Zod before forwarding
- Supports both non-streaming and streaming responses
- Streams Anthropic events as Server-Sent Events (SSE) when `stream=true`
- Records spans/generations and token/cost metadata to Langfuse

## Tech Stack

- Runtime: Bun + TypeScript
- HTTP server: Express 5
- LLM provider: `@anthropic-ai/sdk`
- Observability: OpenTelemetry (`@opentelemetry/sdk-node`) + Langfuse (`@langfuse/otel`, `@langfuse/tracing`)
- Validation: Zod
- Logging: tslog

## Project Structure

- `src/index.ts`: app entrypoint
- `src/api.ts`: Express server and `/v1/messages` route
- `src/types.ts`: request schema + model pricing table
- `src/instrumentation.ts`: OpenTelemetry/Langfuse setup
- `src/logger.ts`: structured logger with trace/span IDs
- `compose.yaml`: local Langfuse stack (web, worker, postgres, redis, clickhouse, minio)

## Prerequisites

- Bun installed
- Anthropic API key
- Docker + Docker Compose (optional, if running local Langfuse)

## Environment Variables

Minimum required to run the proxy:

- `INTERNAL_API_KEY`: bearer token your clients must send
- `ANTHROPIC_API_KEY`: key used for upstream Anthropic calls (can also be from an Anthopric-compatible provider like Kimi or DeepSeek)

For Langfuse tracing export:

- `LANGFUSE_BASE_URL` (for local stack: `http://localhost:3000`)
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`

Optional:

- `DEPLOYMENT_ENVIRONMENT` (recorded in tracing metadata)
- `LOG_LEVEL` (`silly|trace|debug|info|warn|error|fatal`, default `debug`)
- `ANTHROPIC_BASE_URL` (Base URL for the Anthropic API, supports all Anthropic-compatible providers, like Kimi or DeepSeek)

## Install

From NPM:

```bash
npm install -g @cle-does-things/fuseproxy
```

From source:

```bash
git clone https://github.com/AstraBert/fuseproxy
cd fuseproxy
bun install
```

## Run

If installed with NPM:

```bash
fuseproxy run
```

With `npx`:

```bash
npx @cle-does-things/fuseproxy run
```

If installed from source:

```bash
bun run start
```

Server listens on `http://localhost:5678`.

## Example Request

```bash
curl -X POST http://localhost:5678/v1/messages \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 256,
    "system": "You are concise.",
    "messages": [{"role":"user","content":"Say hello in one sentence."}],
    "stream": false
  }'
```

## GitHub Copilot CLI Setup

Follow these steps to configure Copilot to route its LLM requests through `fuseproxy`:

1. Start the proxy:

```bash
bun run start
```

2. In another shell, load Copilot env vars:

```bash
export COPILOT_PROVIDER_TYPE="anthropic" && \
    export COPILOT_PROVIDER_BEARER_TOKEN="<internal fuseproxy bearer token>" && \
    export COPILOT_MODEL="claude-opus-4-7" && \
    export COPILOT_PROVIDER_BASE_URL=http://localhost:5678 && \
    export COPILOT_PROVIDER_MAX_OUTPUT_TOKENS=32000 && \
    export COPILOT_PROVIDER_MAX_PROMPT_TOKENS=64000
```

3. Confirm values are set:

```bash
echo "$COPILOT_PROVIDER_TYPE"
echo "$COPILOT_PROVIDER_BASE_URL"
echo "$COPILOT_MODEL"
```

> Important: `COPILOT_PROVIDER_BEARER_TOKEN` must match `INTERNAL_API_KEY` used by the proxy, or requests will return `401 Unauthorized`.

## Streaming Behavior

When `stream=true`, the service:

- Sets `Content-Type: text/event-stream`
- Forwards Anthropic stream events as SSE (`event: <type>`, `data: <json>`)
- Emits an `error` event and closes the stream on failure

## Local Langfuse Stack (Optional)

A full local Langfuse stack is provided in `compose.yaml`.

1. Review `compose.yaml` and replace every `# CHANGEME` secret.
2. Start services:

```bash
docker compose up -d
```

3. Open Langfuse at `http://localhost:3000`.

Default exposed ports include:

- `3000`: Langfuse web
- `3030`: Langfuse worker
- `9090`: MinIO S3 endpoint

## Development Commands

```bash
bun run lint
bun run prettier
bun run prettier:check
```

## Notes

- The proxy currently implements Anthropic-style `/v1/messages` only.
- `src/types.ts` includes a `MODEL_COSTS` table used to estimate generation cost metadata for traces.
- Graceful shutdown flushes Langfuse spans on `SIGINT`/`SIGTERM`.
