import { isAppNameTakenError, getAiOnboardingAction } from '../helper';

describe('isAppNameTakenError', () => {
  it('recognises the 409 the database constraint produces', () => {
    expect(isAppNameTakenError({ statusCode: 409, error: 'This app name is already taken.' })).toBe(true);
  });

  // Regression: the pre-check in createImportedAppForUser answers 400, not 409. deployApp only
  // looked for 409, returned the error object, and AppModal treated that as success and closed.
  it('recognises the 400 the name pre-check produces', () => {
    expect(isAppNameTakenError({ statusCode: 400, error: 'This app name is already taken.' })).toBe(true);
  });

  it('does not treat other 400s as a name conflict', () => {
    expect(isAppNameTakenError({ statusCode: 400, error: 'App definition not found' })).toBe(false);
  });

  it('does not treat a non-string error body as a name conflict', () => {
    expect(isAppNameTakenError({ statusCode: 400, error: { type: 'permission-check' } })).toBe(false);
    expect(isAppNameTakenError({ statusCode: 400 })).toBe(false);
  });

  it('does not treat server errors or empty input as a name conflict', () => {
    expect(isAppNameTakenError({ statusCode: 500, error: 'This app name is already taken.' })).toBe(false);
    expect(isAppNameTakenError(undefined)).toBe(false);
  });
});

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
