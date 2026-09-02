/** @group working */
import { isLostAgentReconnection } from '@ee/ai/util.service';

describe('AI agent connection recovery', () => {
  it('accepts a new thread on the initial connection', () => {
    expect(isLostAgentReconnection(1, false)).toBe(false);
  });

  it('reattaches when the agent retained the thread', () => {
    expect(isLostAgentReconnection(2, true)).toBe(false);
  });

  it('rejects a reconnect after the agent lost the thread', () => {
    expect(isLostAgentReconnection(2, false)).toBe(true);
  });
});
