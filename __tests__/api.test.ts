import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../src/api";

const REQUIRED_ENV_VARS = [
  "INTERNAL_API_KEY",
  "ANTHROPIC_API_KEY",
  "LANGFUSE_BASE_URL",
  "LANGFUSE_PUBLIC_KEY",
  "LANGFUSE_SECRET_KEY",
] as const;

const hasRequiredEnv = REQUIRED_ENV_VARS.every((name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
});

const testIfEnv = hasRequiredEnv ? it : it.skip;

describe("POST /v1/messages happy path", () => {
  testIfEnv("returns 200 and a valid Anthropic response", async () => {
    const response = await request(app)
      .post("/v1/messages")
      .set("Authorization", `Bearer ${process.env.INTERNAL_API_KEY!}`)
      .send({
        model: "claude-opus-4-7",
        max_tokens: 64,
        stream: false,
        system: "You are concise.",
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("model");
    expect(response.body).toHaveProperty("content");
    expect(Array.isArray(response.body.content)).toBe(true);
  });

  testIfEnv("streams SSE events when stream=true", async () => {
    const response = await request(app)
      .post("/v1/messages")
      .set("Authorization", `Bearer ${process.env.INTERNAL_API_KEY!}`)
      .send({
        model: "claude-opus-4-7",
        max_tokens: 64,
        stream: true,
        system: "You are concise.",
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
      });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
    expect(response.text).toContain("event:");
    expect(response.text).toContain("data:");
  });
});
