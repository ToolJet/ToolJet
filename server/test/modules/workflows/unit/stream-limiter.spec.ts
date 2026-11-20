import { StreamLimiter } from '@modules/workflows/admission/stream-limiter';

/**
 * Open run streams per client IP on one pod (R17).
 *
 * @group workflows
 */
describe('StreamLimiter', () => {
  it('should allow up to the limit per IP, refuse the next, and free a slot when a stream closes', () => {
    const limiter = new StreamLimiter(2);
    const first = limiter.admit('1.2.3.4');
    limiter.admit('1.2.3.4');

    expect(() => limiter.admit('1.2.3.4')).toThrow('WORKFLOW_LIMIT_STREAMS_PER_IP');
    expect(() => limiter.admit('5.6.7.8')).not.toThrow();

    first();
    first(); // releasing twice frees one slot only
    expect(() => limiter.admit('1.2.3.4')).not.toThrow();
    expect(() => limiter.admit('1.2.3.4')).toThrow();
  });
});
