/** @group working */
import { shouldEmailBuildCompletion } from '@ee/ai/helpers/build-completion-email';
import { APP_TYPES } from '@modules/apps/constants';

const eligible = {
  failed: false,
  incomplete: false,
  cancelled: false,
  intent: 'create',
  appType: APP_TYPES.FRONT_END,
};

describe('AI build completion email eligibility', () => {
  it('emails a first generation that ran to completion', () => {
    expect(shouldEmailBuildCompletion(eligible)).toBe(true);
  });

  it('stays silent on a modification build', () => {
    expect(shouldEmailBuildCompletion({ ...eligible, intent: 'modify' })).toBe(false);
  });

  it('stays silent when the turn built nothing', () => {
    expect(shouldEmailBuildCompletion({ ...eligible, intent: 'none' })).toBe(false);
  });

  it('stays silent for an agent that reports no intent at all', () => {
    expect(shouldEmailBuildCompletion({ ...eligible, intent: null })).toBe(false);
  });

  it('stays silent when the user cancelled the build', () => {
    expect(shouldEmailBuildCompletion({ ...eligible, cancelled: true })).toBe(false);
  });

  it('stays silent when the build failed', () => {
    expect(shouldEmailBuildCompletion({ ...eligible, failed: true })).toBe(false);
  });

  it('does not consume the ready notification for an incomplete build', () => {
    expect(shouldEmailBuildCompletion({ ...eligible, incomplete: true })).toBe(false);
  });

  it('stays silent for modules, which have no editor link to send anyone to', () => {
    expect(shouldEmailBuildCompletion({ ...eligible, appType: APP_TYPES.MODULE })).toBe(false);
  });

  it('stays silent for workflows', () => {
    expect(shouldEmailBuildCompletion({ ...eligible, appType: APP_TYPES.WORKFLOW })).toBe(false);
  });

  // No preference gate by design: the email follows work the user started, and the way out of it
  // is the unsubscribe link in the footer, not an in-product toggle.
  it('does not consult any user preference', () => {
    expect(shouldEmailBuildCompletion({ ...eligible, ...({ emailsEnabled: false } as any) })).toBe(true);
  });
});
