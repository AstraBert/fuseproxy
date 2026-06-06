import { Logger, type ILogObj } from "tslog";

const logLevels = new Map<string, number>([
  ["silly", 0],
  ["trace", 1],
  ["debug", 2],
  ["info", 3],
  ["warn", 4],
  ["error", 5],
  ["fatal", 6],
]);

function getLogLevel() {
  const level = process.env.LOG_LEVEL;
  if (!level) {
    return 2; // debug
  } else {
    const log = logLevels.get(level.toLowerCase());
    if (log) {
      return log;
    }
    return 2; // debug
  }
}

export class PrefixedLogger {
  private logger: Logger<ILogObj>;
  prefix: string;
  private _traceId: string | undefined = undefined;
  private _spanId: string | undefined = undefined;
  private _authMethod: string | undefined = undefined;
  private _model: string | undefined = undefined;

  constructor(prefix: string) {
    this.logger = new Logger<ILogObj>({ minLevel: getLogLevel() }); // debug
    this.prefix = prefix;
  }

  public get traceId() {
    return this._traceId ?? "no-trace";
  }

  public set traceId(traceId: string) {
    this._traceId = traceId;
  }

  public get spanId() {
    return this._spanId ?? "no-span";
  }

  public set spanId(spanId: string) {
    this._spanId = spanId;
  }

  public get authMethod(): string {
    return this._authMethod ?? "unknown";
  }

  public set authMethod(method: "x-api-key" | "Authorization") {
    this._authMethod = method;
  }

  public get model(): string {
    return this._model ?? "unset";
  }

  public set model(model: string) {
    this._model = model;
  }

  info(message: string, ...args: unknown[]) {
    this.logger.info(`${this.prefix} ${message}`, ...args, {
      spanId: this.spanId,
      traceId: this.traceId,
      authMethod: this.authMethod,
      model: this.model,
    });
  }

  debug(message: string, ...args: unknown[]) {
    this.logger.debug(`${this.prefix} ${message}`, ...args, {
      spanId: this.spanId,
      traceId: this.traceId,
      authMethod: this.authMethod,
      model: this.model,
    });
  }

  error(message: string, ...args: unknown[]) {
    this.logger.error(`${this.prefix} ${message}`, ...args, {
      spanId: this.spanId,
      traceId: this.traceId,
      authMethod: this.authMethod,
      model: this.model,
    });
  }

  warn(message: string, ...args: unknown[]) {
    this.logger.warn(`${this.prefix} ${message}`, ...args, {
      spanId: this.spanId,
      traceId: this.traceId,
      authMethod: this.authMethod,
      model: this.model,
    });
  }

  silly(message: string, ...args: unknown[]) {
    this.logger.silly(`${this.prefix} ${message}`, ...args, {
      spanId: this.spanId,
      traceId: this.traceId,
      authMethod: this.authMethod,
      model: this.model,
    });
  }

  fatal(message: string, ...args: unknown[]) {
    this.logger.fatal(`${this.prefix} ${message}`, ...args, {
      spanId: this.spanId,
      traceId: this.traceId,
      authMethod: this.authMethod,
      model: this.model,
    });
  }

  trace(message: string, ...args: unknown[]) {
    this.logger.trace(`${this.prefix} ${message}`, ...args, {
      spanId: this.spanId,
      traceId: this.traceId,
      authMethod: this.authMethod,
      model: this.model,
    });
  }
}
