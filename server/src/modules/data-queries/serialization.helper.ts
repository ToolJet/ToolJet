import { decamelizeKeys } from 'humps';
import { decode } from 'js-base64';

/**
 * Single source of truth for how a data query is serialized into the app JSON,
 * shared by getAll, getOne, getBySlug and getVersion (CE + EE) so every endpoint
 * ships data queries in an identical shape.
 *
 * The recipe:
 *   1. Drop the `dataSource` relation — the frontend never reads the bundled
 *      object (it resolves the data source from the global list by data_source_id)
 *   2. `decamelizeKeys` the entity SCALARS → snake_case top-level fields
 *      (data_source_id, app_version_id, created_at…).
 *   3. Restore `options` VERBATIM — it is a free-form, mixed-case user/plugin blob
 *      (camel cross-cutting keys like runOnPageLoad alongside intentionally-snake
 *      plugin keys like sql_execution). It must never be key-transformed.
 *
 * `plugin`, `plugins`, `dataSource` and `options` are detached BEFORE decamelizing
 * so their internals are never mangled (e.g. a pre-decoded plugin manifest object
 * would otherwise get its keys snake_cased). The plugin is then re-attached via
 * serializePlugin, which decodes the manifest/icon idempotently — whether the
 * source repo shipped a raw Buffer (getAll) or a pre-decoded object (findVersion).
 */

const decodeFileData = (file: any): any => {
  if (!file || file.data === undefined || file.data === null) return file?.data;
  // Raw buffer from the DB → base64-decode + JSON.parse (getAll path).
  if (Buffer.isBuffer(file.data)) {
    return JSON.parse(decode(file.data.toString('utf8')));
  }
  // Already decoded object (findVersion pre-decodes the manifest) → use as-is.
  return file.data;
};

export function serializePlugin(plugin: any): any {
  if (!plugin) return undefined;

  // Detach the heavy data payloads so decamelizeKeys never recurses into
  // manifest/icon internals.
  const manifestFile = plugin.manifestFile;
  const iconFile = plugin.iconFile;
  const strippedPlugin = { ...plugin };
  if (strippedPlugin.manifestFile) strippedPlugin.manifestFile = { ...manifestFile, data: undefined };
  if (strippedPlugin.iconFile) strippedPlugin.iconFile = { ...iconFile, data: undefined };

  const out = decamelizeKeys(strippedPlugin);

  if (manifestFile) {
    out['manifest_file'] = { ...out['manifest_file'], data: decodeFileData(manifestFile) };
  }
  if (iconFile) {
    const data = Buffer.isBuffer(iconFile.data) ? iconFile.data.toString('utf8') : iconFile.data;
    out['icon_file'] = { ...out['icon_file'], data };
  }

  return out;
}

export function serializeDataQuery(query: any): any {
  if (!query) return query;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { dataSource, plugin, plugins, options, ...scalars } = query;

  const serialized = decamelizeKeys(scalars);
  serialized['options'] = options; // verbatim

  if (plugin) {
    serialized['plugin'] = serializePlugin(plugin);
  }

  return serialized;
}

export function serializeDataQueries(queries: any[] = []): any[] {
  return (queries || []).map(serializeDataQuery);
}
