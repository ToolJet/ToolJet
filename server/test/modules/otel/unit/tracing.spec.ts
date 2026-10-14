import { PG_INSTRUMENTATION_CONFIG } from '@otel/tracing';

describe('PG_INSTRUMENTATION_CONFIG', () => {
  it('never records bound sql parameters (tokens, password hashes)', () => {
    expect(PG_INSTRUMENTATION_CONFIG.enhancedDatabaseReporting).toBe(false);
  });
});
