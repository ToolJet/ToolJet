type AccessState = {
  license?: { featureAccess?: { customComponentLibraries?: boolean; codeAppsDevTrack?: boolean } };
  appStore?: { modules?: Record<string, { app?: { buildMode?: string } } | undefined> };
};

/**
 * Whether custom components may run in this app. Custom component libraries are a plan feature of their own. A Code
 * mode app is built from its own library, and Code mode is on every enterprise plan (codeAppsDevTrack), so a Code mode
 * app needs no custom component license; a visual app does, Code mode or not.
 */
export const hasCustomComponentAccess = (state: AccessState, moduleId = 'canvas'): boolean => {
  const featureAccess = state.license?.featureAccess;
  if (featureAccess?.customComponentLibraries === true) return true;
  return featureAccess?.codeAppsDevTrack === true && state.appStore?.modules?.[moduleId]?.app?.buildMode === 'code';
};
