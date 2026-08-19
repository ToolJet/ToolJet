import { buildBaseLogger, __resetBaseLoggerForTests } from '../../../../src/modules/logging/base-logger';

describe('buildBaseLogger', () => {
  const ENV_KEYS = [
    'NODE_ENV',
    'LOG_LEVEL',
    'ORM_LOGGING',
    'ENABLE_OTEL',
    'OTEL_EXPORTER_OTLP_LOGS',
    'OTEL_LOGS_LEVEL',
  ];
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
      const otelLogs = require('@otel/logs');
      const emitted: unknown[] = [];
      const originalGetServerLogger = otelLogs.getServerLogger;
      otelLogs.getServerLogger = () => ({ emit: (record: unknown) => emitted.push(record) });

      try {
        const logger = build({
          NODE_ENV: 'production',
          ORM_LOGGING: 'error', // stdout stays quiet — split verbosity must survive unification
          ENABLE_OTEL: 'true',
          OTEL_EXPORTER_OTLP_LOGS: 'http://localhost:4318/v1/logs',
        });

        // simulates loader.ts's LoggerModule.forRoot({ pinoHttp: { logger: buildBaseLogger() } })
        logger.info('request completed');
        // simulates TransactionLogger, which now consumes the same buildBaseLogger() result
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

  it('still forces "trace" in development when LOG_LEVEL is unset', () => {
    const logger = build({ NODE_ENV: 'development' });

    expect(logger.level).toBe('trace');
  });

  describe('OTEL gating (I3 — both ENABLE_OTEL and OTEL_EXPORTER_OTLP_LOGS must be set)', () => {
    it('does not lower the floor when ENABLE_OTEL is on but OTEL_EXPORTER_OTLP_LOGS is unset', () => {
      const logger = build({ NODE_ENV: 'production', ORM_LOGGING: 'error', ENABLE_OTEL: 'true' });

      // stayed at 'error' — proves the OTLP stream was never wired, since wiring it would
      // have forced the floor down to let info-level lines through to it
      expect(logger.level).toBe('error');
    });

    it('lowers the floor once both gates are actually satisfied', () => {
      const logger = build({
        NODE_ENV: 'production',
        ORM_LOGGING: 'error',
        ENABLE_OTEL: 'true',
        OTEL_EXPORTER_OTLP_LOGS: 'http://localhost:4318/v1/logs',
      });

      expect(logger.level).toBe('info');
    });

    it('OTEL_LOGS_LEVEL overrides the default "info" floor for the OTLP stream', () => {
      const logger = build({
        NODE_ENV: 'production',
        ORM_LOGGING: 'error',
        ENABLE_OTEL: 'true',
        OTEL_EXPORTER_OTLP_LOGS: 'http://localhost:4318/v1/logs',
        OTEL_LOGS_LEVEL: 'warn',
      });

      // floor only needs to drop as far as 'warn' now, not all the way to 'info'
      expect(logger.level).toBe('warn');
    });

    it('falls back to "info" when OTEL_LOGS_LEVEL is not a recognized pino level', () => {
      const logger = build({
        NODE_ENV: 'production',
        ORM_LOGGING: 'error',
        ENABLE_OTEL: 'true',
        OTEL_EXPORTER_OTLP_LOGS: 'http://localhost:4318/v1/logs',
        OTEL_LOGS_LEVEL: 'not-a-real-level',
      });

      expect(logger.level).toBe('info');
    });
  });
});
