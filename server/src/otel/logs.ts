import type { Logger } from '@opentelemetry/api-logs';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME, deploymentEnvironmentName } from './semconv';

// Module-local provider, deliberately NOT registered via logs.setGlobalLoggerProvider:
// tracing.ts runs PinoInstrumentation, whose dormant log-sending bridge activates against
// a global provider and would ship ALL server pino logs to the logs backend.
let provider: LoggerProvider | undefined;

export const initializeOtelLogs = () => {
  if (provider || !process.env.OTEL_EXPORTER_OTLP_LOGS) return;

  provider = new LoggerProvider({
    // Must match tracing.ts, else logs and metrics disagree on service identity
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.SERVICE_NAME || 'tooljet',
      [ATTR_SERVICE_VERSION]: globalThis.TOOLJET_VERSION || process.env.SERVICE_VERSION || 'unknown',
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: deploymentEnvironmentName(),
    }),
    processors: [
      // Bounded queue (default 2048); drops on overflow / exporter failure instead of retry-spamming
      new BatchLogRecordProcessor(new OTLPLogExporter({ url: process.env.OTEL_EXPORTER_OTLP_LOGS })),
    ],
  });
};

export const getFrontendErrorLogger = (): Logger | undefined => provider?.getLogger('tooljet-frontend-errors');

// Same module-local provider, different logger name — server logs land in the same
// place as frontend error logs, distinguishable in Loki by the logger/service name.
export const getServerLogger = (): Logger | undefined => provider?.getLogger('tooljet-server');
