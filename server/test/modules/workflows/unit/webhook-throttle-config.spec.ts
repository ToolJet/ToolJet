import { webhookThrottleLimit, webhookThrottleTtl } from '@modules/workflows/constants/queue-config';

describe('webhook throttle settings', () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  it.each([
    ['unset', undefined, 100],
    ['a number string', '7', 7],
    ['non-numeric', 'abc', 100],
    ['zero', '0', 100],
    ['negative', '-5', 100],
    ['empty', '', 100],
  ])('limit: %s', (_label, raw, expected) => {
    if (raw === undefined) delete process.env.WEBHOOK_THROTTLE_LIMIT;
    else process.env.WEBHOOK_THROTTLE_LIMIT = raw;
    expect(webhookThrottleLimit()).toBe(expected);
  });

  it.each([
    ['unset', undefined, 60000],
    ['a number string', '1500', 1500],
    ['non-numeric', 'abc', 60000],
    ['zero', '0', 60000],
    ['negative', '-5', 60000],
  ])('ttl: %s', (_label, raw, expected) => {
    if (raw === undefined) delete process.env.WEBHOOK_THROTTLE_TTL;
    else process.env.WEBHOOK_THROTTLE_TTL = raw;
    expect(webhookThrottleTtl()).toBe(expected);
  });
});
