/** @group working */
import { classifyTurn, hasAwaitingInputSection } from '@ee/ai/helpers/turn-outcome';

const completed = {
  cancelled: false,
  agentErrored: false,
  inconclusive: false,
  errorCategory: null,
  hasPendingInterrupt: false,
  hasAwaitingInputSection: false,
};

describe('classifying how an agent turn concluded', () => {
  it('reports a clean turn as completed', () => {
    expect(classifyTurn(completed)).toBe('completed');
  });

  it('reports a genuine agent failure as failed', () => {
    expect(classifyTurn({ ...completed, agentErrored: true, errorCategory: 'build_failed' })).toBe('failed');
  });

  it('keeps a transient provider problem a failure, since the user cannot act on it', () => {
    // Nothing in the chat is waiting for an answer: "try again shortly" is advice, not a gate.
    expect(classifyTurn({ ...completed, agentErrored: true, errorCategory: 'provider_rate_limited' })).toBe('failed');
    expect(classifyTurn({ ...completed, agentErrored: true, errorCategory: 'provider_unavailable' })).toBe('failed');
  });

  it('reads an empty credit balance as waiting on the user, not as a failed build', () => {
    // The agent's own wording for this category is "Add credits in your workspace settings, then
    // send the request again" — an instruction to the user, which "Build failed" buries.
    expect(classifyTurn({ ...completed, agentErrored: true, errorCategory: 'insufficient_credits' })).toBe(
      'awaiting_input'
    );
  });

  it('reads rejected provider credentials the same way', () => {
    expect(classifyTurn({ ...completed, agentErrored: true, errorCategory: 'provider_config' })).toBe(
      'awaiting_input'
    );
  });

  it('reads a gate the agent parked on as waiting, even when it was reported as an error', () => {
    // The missing-connector hand-off pushes a Connect card and then closes the turn over the error
    // channel. The card is the truth about where the turn came to rest.
    expect(
      classifyTurn({
        ...completed,
        agentErrored: true,
        errorCategory: 'build_incomplete',
        hasAwaitingInputSection: true,
      })
    ).toBe('awaiting_input');
  });

  it('reads a pending interrupt as waiting, whatever else the turn reported', () => {
    expect(classifyTurn({ ...completed, hasPendingInterrupt: true })).toBe('awaiting_input');
  });

  it('refuses to call a closed socket window a failure', () => {
    // This timer starts before the agent's own clock, so it fires while the build may still be
    // running. Neither wording can be stood behind.
    expect(classifyTurn({ ...completed, agentErrored: true, inconclusive: true })).toBe('inconclusive');
  });

  it('puts a user cancellation ahead of everything', () => {
    expect(
      classifyTurn({ ...completed, cancelled: true, agentErrored: true, hasPendingInterrupt: true })
    ).toBe('cancelled');
  });
});

describe('spotting a message that ends on a question', () => {
  it('sees an interactive gate widget', () => {
    expect(hasAwaitingInputSection([{ type: 'markdown' }, { type: 'output-widget-interactive' }])).toBe(true);
  });

  it('sees the connect-a-datasource card', () => {
    expect(hasAwaitingInputSection([{ type: 'datasource-connect' }])).toBe(true);
  });

  it('ignores a gate the turn already moved past', () => {
    // A build that opened a gate early and then carried on has answered its own question; only
    // where the turn came to rest says anything about whether it is waiting.
    expect(hasAwaitingInputSection([{ type: 'output-widget-interactive' }, { type: 'markdown' }])).toBe(false);
  });

  it('copes with a turn that produced no sections', () => {
    expect(hasAwaitingInputSection(undefined)).toBe(false);
    expect(hasAwaitingInputSection([])).toBe(false);
  });
});
