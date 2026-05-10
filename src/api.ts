import express from "express";
// import OpenAI from "openai";
// import { observeOpenAI } from "@langfuse/openai";
import { sdk } from "./instrumentation";
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicError } from "@anthropic-ai/sdk/error.js";
import {
  startActiveObservation,
  startObservation,
  type LangfuseGenerationAttributes,
} from "@langfuse/tracing";
import { VERSION } from "./version";
import { MessagesAPIRequest, MODEL_COSTS } from "./types";

const app = express();
const port = 5678;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());

app.post("/v1/messages", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || (auth && !auth.startsWith("Bearer "))) {
    console.log("no bearer");
    res.status(401).send({ detail: "Unauthorized" });
    return;
  }
  const apiKey = auth.replace("Bearer ", "");
  if (apiKey != process.env.INTERNAL_API_KEY) {
    console.log("API key does not match");
    res.status(401).send({ detail: "Unauthorized" });
    return;
  }
  try {
    const observeAnthropic = async () => {
      await startActiveObservation("request", async (span) => {
        const validated = await MessagesAPIRequest.parseAsync(req.body);
        const userInput = validated.messages.at(validated.messages.length - 1)!;
        span.update({ input: { query: userInput.content } });
        const generation = startObservation(
          "llm-call",
          {
            model: validated.model,
            input: validated.messages,
            metadata: {
              cache_control: validated.cache_control,
              tools: validated.tools,
              tool_choice: validated.tool_choice,
              user_id: validated.metadata.user_id,
              stream: validated.stream,
            },
            completionStartTime: new Date(),
            modelParameters: {
              max_output_tokens: validated.max_tokens,
              thinking: validated.thinking,
            },
            environment: process.env.DEPLOYMENT_ENVIRONMENT,
            version: VERSION,
          } as unknown as LangfuseGenerationAttributes,
          { asType: "generation" },
        );
        if (!validated.stream) {
          const response = await anthropic.messages.create(req.body);
          generation
            .update({
              output: response.content,
              usageDetails: {
                cacheCreationInputTokens:
                  response.usage.cache_creation_input_tokens ?? 0,
                cacheReadInputTokens:
                  response.usage.cache_read_input_tokens ?? 0,
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens:
                  response.usage.input_tokens +
                  (response.usage.cache_read_input_tokens ?? 0) +
                  response.usage.output_tokens,
              },
              costDetails: {
                inputCost:
                  (response.usage.input_tokens ?? 0 / 1_000_000) *
                  MODEL_COSTS[validated.model]!.baseInput,
                cacheCreationCost:
                  (response.usage.cache_creation_input_tokens ??
                    0 / 1_000_000) *
                  ((validated.cache_control?.ttl ?? "5m") === "5m"
                    ? MODEL_COSTS[validated.model]!.cacheWrite5m
                    : MODEL_COSTS[validated.model]!.cacheWrite1h),
                cacheHitsCost:
                  (response.usage.cache_read_input_tokens ?? 0 / 1_000_000) *
                  MODEL_COSTS[validated.model]!.cacheHitsRefreshes,
                outputCost:
                  (response.usage.output_tokens / 1_000_000) *
                  MODEL_COSTS[validated.model]!.output,
              },
              model: response.model,
              metadata: {
                id: response.id,
                request_id: response._request_id,
                stop_reason: response.stop_reason,
              },
            })
            .end();
          span.update({ output: "SUCCESS" });
          res
            .status(200)
            .setHeader("Content-Type", "application/json")
            .send(response);
          return;
        } else {
          // Set SSE headers before any data flows
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          res.flushHeaders(); // flush immediately so the client knows streaming started

          const stream = anthropic.messages.stream(req.body);

          for await (const event of stream) {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
            if (event.type === "message_delta") {
              generation.update({
                output: event.delta,
                usageDetails: {
                  promptTokens: event.usage.input_tokens ?? 0,
                  completionTokens: event.usage.output_tokens,
                  cacheReadInputTokens:
                    event.usage.cache_read_input_tokens ?? 0,
                  cacheCreationInputTokens:
                    event.usage.cache_creation_input_tokens ?? 0,
                  totalTokens:
                    (event.usage.input_tokens ?? 0) +
                    (event.usage.cache_read_input_tokens ?? 0) +
                    event.usage.output_tokens,
                },
                costDetails: {
                  inputCost:
                    (event.usage.input_tokens ?? 0 / 1_000_000) *
                    MODEL_COSTS[validated.model]!.baseInput,
                  cacheCreationCost:
                    (event.usage.cache_creation_input_tokens ?? 0 / 1_000_000) *
                    ((validated.cache_control?.ttl ?? "5m") === "5m"
                      ? MODEL_COSTS[validated.model]!.cacheWrite5m
                      : MODEL_COSTS[validated.model]!.cacheWrite1h),
                  cacheHitsCost:
                    (event.usage.cache_read_input_tokens ?? 0 / 1_000_000) *
                    MODEL_COSTS[validated.model]!.cacheHitsRefreshes,
                  outputCost:
                    (event.usage.output_tokens / 1_000_000) *
                    MODEL_COSTS[validated.model]!.output,
                },
              });
            }
          }
          generation.end();
          span.update({ output: "SUCCESS" });
          res.end();
        }
      });
    };
    await observeAnthropic();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).json({ detail: `An error occurred: ${e}` });
    } else {
      res.write(
        `data: ${JSON.stringify({ type: "error", error: { message: e instanceof AnthropicError ? e.message : `An error occurred: ${e}` } })}\n\n`,
      );
      res.end();
    }
  }
});

export async function runServer() {
  try {
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  } finally {
    await sdk.shutdown();
  }
}
