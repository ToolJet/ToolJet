import { INestApplication } from '@nestjs/common';

/**
 * Interface for OTEL Listener implementations
 *
 * This interface defines the contract for OpenTelemetry event listeners.
 * - CE edition will have an empty/no-op implementation
 * - EE edition will have the actual implementation that processes events
 */
export interface IOtelListener {
  /**
   * Initialize the OTEL listener
   * @param app - NestJS application instance
   * @returns Promise that resolves when initialization is complete
   */
  initialize(app: INestApplication): Promise<void>;

  /**
   * Shutdown the OTEL listener
   * Cleanup resources, flush pending events, etc.
   */
  shutdown(): Promise<void>;
}
