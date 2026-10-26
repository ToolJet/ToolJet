import { Test, TestingModule } from '@nestjs/testing';
import { TransactionLogger } from '../../../../src/modules/logging/service';
import { __resetBaseLoggerForTests } from '../../../../src/modules/logging/base-logger';

// Level/OTEL-gating tests live in base-logger.spec.ts — this covers TransactionLogger's
// own job: route/transactionId enrichment and redaction.
describe('TransactionLogger', () => {
  let logger: TransactionLogger;

  beforeEach(async () => {
    __resetBaseLoggerForTests();
    process.env.NODE_ENV = 'test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionLogger],
    }).compile();

    logger = module.get<TransactionLogger>(TransactionLogger);
  });

  describe('M4 — object params are redacted before they reach the message string', () => {
    it('does not let a plaintext credential leave enrichLogData()', () => {
      // the exact repro shape from the review: a caller passes an options object
      // containing a real credential alongside harmless fields
      const enrichLogData = (logger as unknown as { enrichLogData: (...args: unknown[]) => { msg?: string } })
        .enrichLogData;
      const { msg } = enrichLogData.call(logger, 'datasource connect failed', {
        host: 'db.internal',
        password: 'hunter2',
        ssl: false,
      });

      expect(msg).not.toContain('hunter2');
      expect(msg).toContain('[REDACTED]');
      expect(msg).toContain('db.internal'); // non-sensitive fields still make it through
    });
  });
});
