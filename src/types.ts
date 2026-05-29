import z from "zod";

const MessageModel = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(z.record(z.string(), z.unknown()))]),
});

const CacheControlModel = z.object({
  type: z.enum(["ephemeral"]),
  ttl: z.enum(["5m", "1h"]).optional(),
});

const MetadataModel = z.object({
  user_id: z.string().nullable().default(null),
});

const OutputConfigFormatModel = z.object({
  type: z.literal("json_schema"),
  schema: z.record(z.string(), z.unknown()),
});

const OutputConfigModel = z.object({
  effort: z
    .enum(["low", "medium", "high", "xhigh", "max"])
    .nullable()
    .default(null),
  format: OutputConfigFormatModel.nullable().default(null),
});

const ThinkingConfigEnabledModel = z.object({
  budget_tokens: z.number(),
  type: z.literal("enabled"),
  display: z.enum(["omitted", "summarized"]).nullable().default(null),
});

const ThinkingConfigDisabledModel = z.object({
  type: z.literal("disabled"),
});

const ThinkingConfigAdaptiveModel = z.object({
  type: z.literal("adaptive"),
  display: z.enum(["omitted", "summarized"]).nullable().default(null),
});

export const MessagesAPIRequest = z.object({
  max_tokens: z.number().optional(),
  messages: z.array(MessageModel),
  model: z.string(),
  metadata: MetadataModel.default(MetadataModel.parse({})),
  output_config: OutputConfigModel.default(OutputConfigModel.parse({})),
  thinking: z
    .union([
      ThinkingConfigEnabledModel,
      ThinkingConfigAdaptiveModel,
      ThinkingConfigDisabledModel,
    ])
    .optional(),
  system: z.union([z.string(), z.array(z.record(z.string(), z.unknown()))]),
  tool_choice: z.record(z.string(), z.unknown()).optional(),
  tools: z.array(z.record(z.string(), z.unknown())).optional(),
  stream: z.boolean().default(false),
  cache_control: CacheControlModel.nullable().default(null),
  container: z.string().nullable().default(null),
  inference_geo: z.string().nullable().default(null),
  service_tier: z.enum(["auto", "standard_only"]).optional(),
  stop_sequences: z.array(z.string()).optional(),
});

type ModelCosts = {
  baseInput: number; // $ per MTok
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheHitsRefreshes: number;
  output: number;
};

export const MODEL_COSTS: Record<string, ModelCosts> = {
  "claude-opus-4-8": {
    baseInput: 5,
    cacheWrite5m: 6.25,
    cacheWrite1h: 10,
    cacheHitsRefreshes: 0.5,
    output: 25,
  },
  "claude-opus-4-7": {
    baseInput: 5,
    cacheWrite5m: 6.25,
    cacheWrite1h: 10,
    cacheHitsRefreshes: 0.5,
    output: 25,
  },
  "claude-opus-4-6": {
    baseInput: 5,
    cacheWrite5m: 6.25,
    cacheWrite1h: 10,
    cacheHitsRefreshes: 0.5,
    output: 25,
  },
  "claude-opus-4-5": {
    baseInput: 5,
    cacheWrite5m: 6.25,
    cacheWrite1h: 10,
    cacheHitsRefreshes: 0.5,
    output: 25,
  },
  "claude-opus-4-1": {
    baseInput: 15,
    cacheWrite5m: 18.75,
    cacheWrite1h: 30,
    cacheHitsRefreshes: 1.5,
    output: 75,
  },
  "claude-opus-4": {
    baseInput: 15,
    cacheWrite5m: 18.75,
    cacheWrite1h: 30,
    cacheHitsRefreshes: 1.5,
    output: 75,
  },
  "claude-sonnet-4-6": {
    baseInput: 3,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheHitsRefreshes: 0.3,
    output: 15,
  },
  "claude-sonnet-4-5": {
    baseInput: 3,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheHitsRefreshes: 0.3,
    output: 15,
  },
  "claude-sonnet-4": {
    baseInput: 3,
    cacheWrite5m: 3.75,
    cacheWrite1h: 6,
    cacheHitsRefreshes: 0.3,
    output: 15,
  },
  "kimi-k2.6": {
    baseInput: 0.95,
    cacheHitsRefreshes: 0.16,
    output: 4,
    cacheWrite5m: 0,
    cacheWrite1h: 0,
  },
};
