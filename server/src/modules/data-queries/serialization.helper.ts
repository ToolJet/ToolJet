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

  // `decamelizeKeys` recurses into the manifest/icon `data`, so RESTORE them here — the manifest
  // is an opaque plugin-schema blob whose keys must stay verbatim. getAll ships a raw DB buffer
  // → base64-decode it (original logic); findVersion pre-decodes it → keep the object as-is.
  if (plugin.manifestFile) {
    out['manifest_file'].data = Buffer.isBuffer(plugin.manifestFile.data)
      ? JSON.parse(decode(plugin.manifestFile.data.toString('utf8')))
      : plugin.manifestFile.data;
  }
  if (plugin.iconFile) {
    out['icon_file'].data = Buffer.isBuffer(plugin.iconFile.data)
      ? plugin.iconFile.data.toString('utf8')
      : plugin.iconFile.data;
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
