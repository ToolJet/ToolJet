import pino from 'pino';
import { buildBaseLogger, __resetBaseLoggerForTests } from '../../../../src/modules/logging/base-logger';

describe('buildBaseLogger', () => {
  const ENV_KEYS = ['NODE_ENV', 'LOG_LEVEL', 'ORM_LOGGING', 'ENABLE_OTEL', 'OTEL_EXPORTER_OTLP_LOGS'];
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    __resetBaseLoggerForTests();
    for (const key of ENV_KEYS) {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  const build = (values: Record<string, string | undefined>) => {
    Object.assign(process.env, values);
    return buildBaseLogger();
  };

  it('is a singleton — the same instance every call, even across different consumers', () => {
    process.env.NODE_ENV = 'test';
    const first = buildBaseLogger();
    const second = buildBaseLogger();

    expect(first).toBe(second);
  });

  describe('I5 — one instance means HTTP/bootstrap logs reach OTLP too, not just TransactionLogger', () => {
    it('a line written through either "consumer" reaches the same OTLP stream', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const otelLogs = require('@otel/logs');
      const emitted: unknown[] = [];
      const originalGetServerLogger = otelLogs.getServerLogger;
      otelLogs.getServerLogger = () => ({ emit: (record: unknown) => emitted.push(record) });

      try {
        const logger = build({
          NODE_ENV: 'production',
          LOG_LEVEL: 'info',
          ENABLE_OTEL: 'true',
          OTEL_EXPORTER_OTLP_LOGS: 'http://localhost:4318/v1/logs',
        });

        logger.info('request completed');
        logger.warn('slow query');

        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(emitted).toHaveLength(2);
      } finally {
        otelLogs.getServerLogger = originalGetServerLogger;
      }
    });
  });

  it('LOG_LEVEL wins outright, even in production with ORM_LOGGING set', () => {
    const logger = build({ NODE_ENV: 'production', ORM_LOGGING: 'error', LOG_LEVEL: 'debug' });

    expect(logger.level).toBe('debug');
  });

  it('LOG_LEVEL overrides even the development default', () => {
    const logger = build({ NODE_ENV: 'development', LOG_LEVEL: 'warn' });

    expect(logger.level).toBe('warn');
  });

  it('falls back to the ORM_LOGGING mapping when LOG_LEVEL is unset — unchanged behavior', () => {
    const logger = build({ NODE_ENV: 'production', ORM_LOGGING: 'all' });

    expect(logger.level).toBe('debug');
  });

  it('falls back to "warn" when neither LOG_LEVEL nor a recognized ORM_LOGGING value is set', () => {
    const logger = build({ NODE_ENV: 'production' });

    expect(logger.level).toBe('warn');
  });

  it('ignores an unrecognized LOG_LEVEL instead of crashing pino at boot', () => {
    // pino throws on an unknown level, so validLevel() is the only thing between a typo'd
    // LOG_LEVEL and a boot failure
    const logger = build({ NODE_ENV: 'production', LOG_LEVEL: 'not-a-level' });

    expect(logger.level).toBe('warn');
  });

  it('still forces "trace" in development when LOG_LEVEL is unset', () => {
    const logger = build({ NODE_ENV: 'development' });

    expect(logger.level).toBe('trace');
  });

  describe('OTEL gating (I3 — both ENABLE_OTEL and OTEL_EXPORTER_OTLP_LOGS must be set)', () => {
    // multistream exposes its destinations on `streams`
    const streamsOf = (logger: pino.Logger): Array<{ level: number }> | undefined =>
      (logger[pino.symbols.streamSym] as unknown as { streams?: Array<{ level: number }> }).streams;

    const bothGates = {
      NODE_ENV: 'production',
      ORM_LOGGING: 'error',
      ENABLE_OTEL: 'true',
      OTEL_EXPORTER_OTLP_LOGS: 'http://localhost:4318/v1/logs',
    };

    it('wires a single destination when ENABLE_OTEL is on but OTEL_EXPORTER_OTLP_LOGS is unset', () => {
      const logger = build({ NODE_ENV: 'production', ORM_LOGGING: 'error', ENABLE_OTEL: 'true' });

      expect(streamsOf(logger)).toBeUndefined();
      expect(logger.level).toBe('error');
    });

    it('wires stdout and the OTLP stream once both gates are satisfied', () => {
      const logger = build(bothGates);

      expect(streamsOf(logger)).toHaveLength(2);
    });

    it('leaves the level alone when OTLP is switched on — both destinations share it', () => {
      const logger = build(bothGates);

      expect(logger.level).toBe('error');
    });

    it('does not clamp a verbose LOG_LEVEL on either destination', () => {
      const logger = build({ ...bothGates, LOG_LEVEL: 'debug' });

      // omitting level would clamp both legs to 'info'
      expect(logger.level).toBe('debug');
      expect(streamsOf(logger)?.map((s) => s.level)).toEqual([0, 0]);
    });
  });
});
