import { INestApplication } from '@nestjs/common';
import { IOtelListener } from './interfaces/IListener';

/**
 * Community Edition (CE) OTEL Listener
 *
 * This is a no-op implementation for Community Edition.
 * - Does not initialize OpenTelemetry
 * - Does not process any events
 * - Does not write telemetry to database
 * - Keeps CE lightweight and dependency-free
 */
class CeOtelListener implements IOtelListener {
  async initialize(app: INestApplication): Promise<void> {
    // No-op for CE edition
    // OTEL is an EE-only feature
    return Promise.resolve();
  }

  async shutdown(): Promise<void> {
    // No-op for CE edition
    return Promise.resolve();
  }
}

// Export singleton instance
export const otelListener = new CeOtelListener();
