import { vi, describe, it, expect, beforeEach, afterAll } from "vitest";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { PrefixedLogger } from "../src/logger";

const LOG_FILE = "log.txt";

vi.mock("tslog", async () => {
  const actual = await vi.importActual<typeof import("tslog")>("tslog");
  const joinLogs = (args: unknown[]) => {
    return args
      .map((a) => {
        if (typeof a === "string") {
          return a;
        } else {
          return JSON.stringify(a);
        }
      })
      .join("\n");
  };
  return {
    ...actual,
    Logger: vi.fn(
      class {
        minLevel: number;
        constructor({ minLevel = 0 }: { minLevel?: number } = {}) {
          this.minLevel = minLevel;
        }
        debug = vi.fn((...args: unknown[]) =>
          writeFileSync(LOG_FILE, "DEBUG\n" + joinLogs(args), {
            encoding: "utf-8",
          }),
        );
        info = vi.fn((...args: unknown[]) =>
          writeFileSync(LOG_FILE, "INFO\n" + joinLogs(args), {
            encoding: "utf-8",
          }),
        );
        error = vi.fn((...args: unknown[]) =>
          writeFileSync(LOG_FILE, "ERROR\n" + joinLogs(args), {
            encoding: "utf-8",
          }),
        );
        warn = vi.fn((...args: unknown[]) =>
          writeFileSync(LOG_FILE, "WARN\n" + joinLogs(args), {
            encoding: "utf-8",
          }),
        );
        trace = vi.fn((...args: unknown[]) =>
          writeFileSync(LOG_FILE, "TRACE\n" + joinLogs(args), {
            encoding: "utf-8",
          }),
        );
        silly = vi.fn((...args: unknown[]) =>
          writeFileSync(LOG_FILE, "SILLY\n" + joinLogs(args), {
            encoding: "utf-8",
          }),
        );
        fatal = vi.fn((...args: unknown[]) =>
          writeFileSync(LOG_FILE, "FATAL\n" + joinLogs(args), {
            encoding: "utf-8",
          }),
        );
      },
    ),
  };
});

function readLogs() {
  const content = readFileSync(LOG_FILE, { encoding: "utf8" });
  return content;
}

const NO_TRACE = JSON.stringify({
  spanId: "no-span",
  traceId: "no-trace",
  authMethod: "unknown",
});
const WITH_TRACE = JSON.stringify({
  spanId: "span-1",
  traceId: "trace-1",
  authMethod: "unknown",
});
const WITH_AUTHMETHOD = JSON.stringify({
  spanId: "span-1",
  traceId: "trace-1",
  authMethod: "x-api-key",
});
const MESSAGE = "this is a test";
const PREFIX = "[test]";

beforeEach(() => {
  writeFileSync(LOG_FILE, "", { encoding: "utf-8" });
});

afterAll(() => {
  unlinkSync(LOG_FILE);
});

describe("Test prefixed logger methods wihout traceId/spanId", () => {
  it("Test info", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.info(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`INFO\n${PREFIX} ${MESSAGE}\n${NO_TRACE}`);
  });

  it("Test debug", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.debug(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`DEBUG\n${PREFIX} ${MESSAGE}\n${NO_TRACE}`);
  });

  it("Test error", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.error(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`ERROR\n${PREFIX} ${MESSAGE}\n${NO_TRACE}`);
  });

  it("Test warn", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.warn(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`WARN\n${PREFIX} ${MESSAGE}\n${NO_TRACE}`);
  });

  it("Test trace", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.trace(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`TRACE\n${PREFIX} ${MESSAGE}\n${NO_TRACE}`);
  });

  it("Test silly", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.silly(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`SILLY\n${PREFIX} ${MESSAGE}\n${NO_TRACE}`);
  });

  it("Test fatal", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.fatal(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`FATAL\n${PREFIX} ${MESSAGE}\n${NO_TRACE}`);
  });
});

describe("Test prefixed logger methods with traceId/spanId", () => {
  it("Test info", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.info(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`INFO\n${PREFIX} ${MESSAGE}\n${WITH_TRACE}`);
  });

  it("Test debug", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.debug(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`DEBUG\n${PREFIX} ${MESSAGE}\n${WITH_TRACE}`);
  });

  it("Test error", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.error(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`ERROR\n${PREFIX} ${MESSAGE}\n${WITH_TRACE}`);
  });

  it("Test warn", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.warn(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`WARN\n${PREFIX} ${MESSAGE}\n${WITH_TRACE}`);
  });

  it("Test trace", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.trace(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`TRACE\n${PREFIX} ${MESSAGE}\n${WITH_TRACE}`);
  });

  it("Test silly", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.silly(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`SILLY\n${PREFIX} ${MESSAGE}\n${WITH_TRACE}`);
  });

  it("Test fatal", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.fatal(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`FATAL\n${PREFIX} ${MESSAGE}\n${WITH_TRACE}`);
  });
});

describe("Test prefixed logger methods with authMethod", () => {
  it("Test info", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.authMethod = "x-api-key";
    logger.info(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`INFO\n${PREFIX} ${MESSAGE}\n${WITH_AUTHMETHOD}`);
  });

  it("Test debug", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.authMethod = "x-api-key";
    logger.debug(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`DEBUG\n${PREFIX} ${MESSAGE}\n${WITH_AUTHMETHOD}`);
  });

  it("Test error", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.authMethod = "x-api-key";
    logger.error(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`ERROR\n${PREFIX} ${MESSAGE}\n${WITH_AUTHMETHOD}`);
  });

  it("Test warn", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.authMethod = "x-api-key";
    logger.warn(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`WARN\n${PREFIX} ${MESSAGE}\n${WITH_AUTHMETHOD}`);
  });

  it("Test trace", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.authMethod = "x-api-key";
    logger.trace(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`TRACE\n${PREFIX} ${MESSAGE}\n${WITH_AUTHMETHOD}`);
  });

  it("Test silly", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.authMethod = "x-api-key";
    logger.silly(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`SILLY\n${PREFIX} ${MESSAGE}\n${WITH_AUTHMETHOD}`);
  });

  it("Test fatal", () => {
    const logger = new PrefixedLogger(PREFIX);
    logger.spanId = "span-1";
    logger.traceId = "trace-1";
    logger.authMethod = "x-api-key";
    logger.fatal(MESSAGE);
    const logs = readLogs();
    expect(logs).toBe(`FATAL\n${PREFIX} ${MESSAGE}\n${WITH_AUTHMETHOD}`);
  });
});
