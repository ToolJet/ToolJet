import { getAiOnboardingAction } from '../helper';

describe('getAiOnboardingAction', () => {
  const base = { aiCookies: { tj_template_id: 'expense-reimbursement' }, canCreateApp: true, appType: 'front-end' };

  it('deploys the template when the website left a template id and the user can create apps', () => {
    expect(getAiOnboardingAction(base)).toBe('template');
  });

  it('creates from the prompt when the website left a prompt', () => {
    expect(getAiOnboardingAction({ ...base, aiCookies: { tj_ai_prompt: 'a crm' } })).toBe('prompt');
  });

  it('prefers the prompt when both cookies are set', () => {
    expect(getAiOnboardingAction({ ...base, aiCookies: { tj_ai_prompt: 'a crm', tj_template_id: 'x' } })).toBe(
      'prompt'
    );
  });

  // Regression: access used to be decided by role name, so a custom group with app_create was refused.
  it('denies a user without app_create, whatever their role', () => {
    expect(getAiOnboardingAction({ ...base, canCreateApp: false })).toBe('denied');
  });

  it('does nothing when no onboarding cookie is set', () => {
    expect(getAiOnboardingAction({ ...base, aiCookies: {} })).toBe('none');
    expect(getAiOnboardingAction({ ...base, aiCookies: { tj_template_id: null } })).toBe('none');
    expect(getAiOnboardingAction({ ...base, aiCookies: undefined })).toBe('none');
  });

  it('does nothing on workflow and module home pages, even with a cookie', () => {
    expect(getAiOnboardingAction({ ...base, appType: 'workflow' })).toBe('none');
    expect(getAiOnboardingAction({ ...base, appType: 'module', canCreateApp: false })).toBe('none');
  });
});
