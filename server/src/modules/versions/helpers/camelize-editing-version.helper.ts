import { camelizeKeys } from 'humps';

type GlobalSettingsPayload = Record<string, unknown> & { theme?: { id?: string }; variables?: unknown };

/** The version as the editor receives it: camelCase keys, with global settings typed where callers read them. */
export type EditingVersionPayload = Record<string, unknown> & { globalSettings?: GlobalSettingsPayload | null };

/**
 * Camelizes the editor's version payload, except the keys of `globalSettings.variables`.
 *
 * `camelizeKeys` recurses into every nested object. Declared app variables are stored keyed by
 * their definition id (a UUID), and the client removes and replaces them by that id, so a
 * camelized key (`05688c6c-efd3-…` → `05688c6cEfd3…`) makes a deleted variable impossible to remove.
 * The definitions themselves are already camelCase, so the map is passed through untouched.
 */
export function camelizeEditingVersion(version: object): EditingVersionPayload {
  const settingsKey = 'globalSettings' in version ? 'globalSettings' : 'global_settings';
  const settings = (version as Record<string, unknown>)[settingsKey] as GlobalSettingsPayload | null | undefined;
  if (!settings || typeof settings !== 'object' || !('variables' in settings)) {
    return camelizeKeys(version) as EditingVersionPayload;
  }

  const { variables, ...otherSettings } = settings;
  const camelized = camelizeKeys({ ...version, [settingsKey]: otherSettings }) as EditingVersionPayload;
  return { ...camelized, globalSettings: { ...camelized.globalSettings, variables } };
}
