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
 * `dataSource` and `options` are handled in serializeDataQuery (dropped / kept verbatim).
 * `plugin`/`plugins` go through serializePlugin; `plugins` is preserved because the frontend's
 * isQueryRunnable checks it.
 */

export function serializePlugin(plugin: any): any {
  if (!plugin) return undefined;

  const out = decamelizeKeys(plugin);

  // getAll ships the manifest/icon as raw DB buffers → base64-decode them (the original logic).
  // Viewer paths (findVersion) pre-decode the manifest and don't load the icon, so we only
  // touch raw buffers and leave already-decoded / absent values untouched.
  if (Buffer.isBuffer(plugin.manifestFile?.data)) {
    out['manifest_file'].data = JSON.parse(decode(plugin.manifestFile.data.toString('utf8')));
  }
  if (Buffer.isBuffer(plugin.iconFile?.data)) {
    out['icon_file'].data = plugin.iconFile.data.toString('utf8');
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
  if (plugins) {
    serialized['plugins'] = plugins.map(serializePlugin);
  }

  return serialized;
}

export function serializeDataQueries(queries: any[] = []): any[] {
  return (queries || []).map(serializeDataQuery);
}
