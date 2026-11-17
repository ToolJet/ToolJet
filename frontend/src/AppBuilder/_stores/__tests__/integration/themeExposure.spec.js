/**
 * Theme exposure suite — how `globals.theme` (App Builder inspector, `{{ }}` bindings)
 * gets its value, and which theme "counts" as active. (ToolJet/ToolJet#17479, tj-ee-5319)
 *
 * Crosses three slices — license (isLicenseValid/isFeatureAccessible), app
 * (globalSettings.theme/appMode, getActiveTheme), and resolved (updateExposedTheme,
 * setResolvedGlobals) — so this runs against the real composed store rather than any
 * one slice in isolation; that is also what guarantees `getActiveTheme()` is the single
 * source of truth `updateExposedTheme` and the CSS-variable effect both read from.
 *
 * Subjects under test:
 *   - appSlice.js: getActiveTheme()
 *   - resolvedSlice.js: updateExposedTheme(overrideMode, moduleId)
 */
import useStore from '@/AppBuilder/_stores/store';
import { baseTheme } from '@/AppBuilder/_stores/utils';

const state = () => useStore.getState();

const licensedFeatureAccess = (overrides = {}) => ({
  customThemes: true,
  licenseStatus: { isLicenseValid: true, isExpired: false },
  ...overrides,
});

const setLicense = (featureAccess) => {
  useStore.setState((s) => {
    s.license = { featureAccess };
  });
};

const setSelectedTheme = (theme) => {
  useStore.setState((s) => {
    s.globalSettings.theme = theme;
  });
};

const setAppMode = (appMode) => {
  useStore.setState((s) => {
    s.globalSettings.appMode = appMode;
  });
};

const customTheme = (overrides = {}) => ({
  id: 'theme-1',
  name: 'Custom Brand',
  definition: {
    brand: { colors: { primary: { light: '#010101', dark: '#fefefe' } } },
  },
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

describe('getActiveTheme', () => {
  test('falls back to baseTheme when the org has no license/feature access', () => {
    setSelectedTheme(customTheme());

    expect(state().getActiveTheme()).toBe(baseTheme);
  });

  test('falls back to baseTheme when customThemes is licensed but the license itself is invalid', () => {
    setLicense(licensedFeatureAccess({ licenseStatus: { isLicenseValid: false, isExpired: false } }));
    setSelectedTheme(customTheme());

    expect(state().getActiveTheme()).toBe(baseTheme);
  });

  test('uses the selected theme when licensed and the theme has a definition', () => {
    setLicense(licensedFeatureAccess());
    const theme = customTheme();
    setSelectedTheme(theme);

    expect(state().getActiveTheme()).toBe(theme);
  });

  test('falls back to baseTheme when licensed but the selected theme has no definition', () => {
    setLicense(licensedFeatureAccess());
    setSelectedTheme({ id: 'theme-2', name: 'Broken Theme' });

    expect(state().getActiveTheme()).toBe(baseTheme);
  });
});

describe('updateExposedTheme — mode derivation', () => {
  test('defaults to light when nothing is set', () => {
    state().updateExposedTheme();

    expect(state().resolvedStore.modules.canvas.exposedValues.globals.theme.name).toBe('light');
  });

  test('falls back to localStorage darkMode when appMode is unset', () => {
    localStorage.setItem('darkMode', 'true');

    state().updateExposedTheme();

    expect(state().resolvedStore.modules.canvas.exposedValues.globals.theme.name).toBe('dark');
  });

  test('globalSettings.appMode wins over localStorage when set to an explicit mode', () => {
    setAppMode('dark');
    localStorage.setItem('darkMode', 'false');

    state().updateExposedTheme();

    expect(state().resolvedStore.modules.canvas.exposedValues.globals.theme.name).toBe('dark');
  });

  test('"auto" appMode is not treated as an explicit mode — falls through to localStorage', () => {
    setAppMode('auto');
    localStorage.setItem('darkMode', 'true');

    state().updateExposedTheme();

    expect(state().resolvedStore.modules.canvas.exposedValues.globals.theme.name).toBe('dark');
  });

  test('an explicit overrideMode wins over appMode and localStorage', () => {
    setAppMode('light');
    localStorage.setItem('darkMode', 'false');

    state().updateExposedTheme('dark');

    expect(state().resolvedStore.modules.canvas.exposedValues.globals.theme.name).toBe('dark');
  });
});

describe('updateExposedTheme — resolved globals.theme shape', () => {
  test('unlicensed org resolves baseTheme colors for the current mode', () => {
    state().updateExposedTheme('dark');

    const theme = state().resolvedStore.modules.canvas.exposedValues.globals.theme;

    expect(theme.themeName).toBe('ToolJet');
    expect(theme.brand.colors.primary).toBe(baseTheme.definition.brand.colors.primary.dark);
    expect(theme.systemStatus.colors.error).toBe(baseTheme.definition.systemStatus.colors.error.dark);
  });

  test('licensed org with a custom theme resolves that theme, not baseTheme', () => {
    setLicense(licensedFeatureAccess());
    setSelectedTheme(customTheme());

    state().updateExposedTheme('light');

    const theme = state().resolvedStore.modules.canvas.exposedValues.globals.theme;

    expect(theme.themeName).toBe('Custom Brand');
    expect(theme.brand.colors.primary).toBe('#010101');
  });

  // Regression guard: isBasic/isDefault were exposed on globals.theme at one point during
  // review, then deliberately dropped as unneeded — must not silently reappear.
  test('does not expose isBasic/isDefault', () => {
    state().updateExposedTheme();

    const theme = state().resolvedStore.modules.canvas.exposedValues.globals.theme;

    expect(theme.isBasic).toBeUndefined();
    expect(theme.isDefault).toBeUndefined();
  });

  test('writes into the given moduleId, not canvas', () => {
    state().initializeResolvedSlice('module-1');
    state().initializeDependencySlice('module-1');

    state().updateExposedTheme('dark', 'module-1');

    expect(state().resolvedStore.modules['module-1'].exposedValues.globals.theme.name).toBe('dark');
    expect(state().resolvedStore.modules.canvas.exposedValues.globals.theme).toBeUndefined();
  });
});
