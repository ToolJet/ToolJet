/**
 * @jest-environment node
 */
// Mock heavy transitive imports pulled in by utils.js so we can unit-test the pure
// validateName logic without loading stores, services, or the widget manager.
jest.mock('config', () => ({ apiUrl: 'http://localhost:3000/api' }), { virtual: true });
jest.mock('@/AppBuilder/WidgetManager', () => ({ componentTypes: [] }));
jest.mock('@/_services', () => ({ workflowExecutionsService: {} }));
jest.mock('@/_services/authentication.service', () => ({ authenticationService: { currentSessionValue: {} } }));
jest.mock('@/_stores/appDataStore', () => ({ useAppDataStore: { getState: () => ({}) } }));
jest.mock('@/_stores/keyboardShortcutStore', () => ({ useKeyboardShortcutStore: { getState: () => ({}) } }));
jest.mock('@/AppBuilder/QueryManager/constants', () => ({ staticDataSources: [] }));
// routes.js pulls in query-string (ESM, not transformed by jest); validateName needs none of it.
jest.mock('../routes', () => ({
  getWorkspaceIdOrSlugFromURL: jest.fn(),
  getSubpath: jest.fn(),
  returnWorkspaceIdIfNeed: jest.fn(),
  eraseRedirectUrl: jest.fn(),
}));
// appUtils.js imports .svg assets (broken jest transformer); validateName needs none of it.
jest.mock('../appUtils', () => ({ getDateTimeFormat: jest.fn() }));
jest.mock('../utility', () => ({ validateMultilineCode: jest.fn() }));

const { validateName } = require('../utils');

const nameOfLength = (n) => 'a'.repeat(n);

describe('validateName — name length limit', () => {
  // Default limit stays 50 for slug/folder/group/etc.
  describe('default maxLength (50)', () => {
    test('accepts a name of exactly 50 characters', () => {
      expect(validateName(nameOfLength(50), 'App').status).toBe(true);
    });

    test('rejects a name longer than 50 characters', () => {
      const result = validateName(nameOfLength(51), 'App');
      expect(result.status).toBe(false);
      expect(result.errorMsg).toBe('Maximum length has been reached.');
    });
  });

  // App/module names pass maxLength=100 (as AppModal does).
  describe('explicit maxLength (100)', () => {
    test('accepts a name of exactly 100 characters', () => {
      // signature: (name, nameType, emptyCheck, showError, allowSpecialChars, allowSpaces, checkReservedWords, allowAllCases, maxLength)
      expect(validateName(nameOfLength(100), 'App', false, false, true, true, false, false, 100).status).toBe(true);
    });

    test('rejects a name of 101 characters', () => {
      const result = validateName(nameOfLength(101), 'App', false, false, true, true, false, false, 100);
      expect(result.status).toBe(false);
      expect(result.errorMsg).toBe('Maximum length has been reached.');
    });
  });
});
