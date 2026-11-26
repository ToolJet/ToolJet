import { camelizeKeysKeepingVariableMaps } from '@helpers/variable-map-keys.helper';

type GlobalSettingsPayload = Record<string, unknown> & { theme?: { id?: string }; variables?: unknown };

/** The version as the editor receives it: camelCase keys, with global settings typed where callers read them. */
export type EditingVersionPayload = Record<string, unknown> & { globalSettings?: GlobalSettingsPayload | null };

/**
 * Camelizes the editor's version payload, except `globalSettings.variables`, which is keyed by
 * variable name (`selectedOrderID`, `user_name`) and must come back exactly as stored.
 */
export function camelizeEditingVersion(version: object): EditingVersionPayload {
  return camelizeKeysKeepingVariableMaps(version) as EditingVersionPayload;
}
