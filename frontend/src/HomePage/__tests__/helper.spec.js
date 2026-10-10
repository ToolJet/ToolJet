import { isAppNameTakenError } from '../helper';

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
