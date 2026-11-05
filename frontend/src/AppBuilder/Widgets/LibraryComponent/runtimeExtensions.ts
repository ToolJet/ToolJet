import * as compareBundles from '@ee/modules/CodeMode/AppBuilder/CodeDiff/compareBundles';
import * as sourceTags from '@ee/modules/CodeMode/AppBuilder/Widgets/LibraryComponent/sourceTags';
import * as appHooks from '@ee/modules/CodeMode/AppBuilder/Widgets/LibraryComponent/codeAppHooks';
import * as themeTokens from '@ee/modules/CodeMode/AppBuilder/Widgets/LibraryComponent/themeTokens';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';

// Runtime hooks the enterprise edition adds for library bundles. Without it, bundles get inert defaults.
const ee = { ...compareBundles, ...sourceTags, ...appHooks, ...themeTokens } as Record<string, any>;
const noop = () => {};

export const compareText: (url: string) => string | null = ee.compareText ?? (() => null);
export const devRuntime = ee.devRuntime ?? jsxDevRuntime;
export const debugApi = ee.debugApi;
export const useCodeAppQuery =
  ee.useQuery ?? (() => ({ data: undefined, loading: false, error: null, run: async () => undefined }));
export const useCodeAppGlobals = ee.useGlobals ?? (() => ({}));
export const useCodeAppNavigation =
  ee.useNavigation ??
  (() => ({ path: '/', routes: [], match: () => null, navigate: noop, back: noop, pages: [], goToPage: noop }));
export const useCodeAppTheme = ee.useTheme ?? (() => ({ mode: 'light' }));
// The people who can open the app (EE). Without it, an empty list that never loads.
export const useCodeAppWorkspaceUsers =
  ee.useWorkspaceUsers ??
  (() => ({ data: [], isLoading: false, error: null, hasMore: false, refetch: async () => [] }));
