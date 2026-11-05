/**
 * Keys that moved inside stored component JSON while their old place is still in the database.
 *
 * Release N's data migration copies each key to its new place and keeps both places equal until its cleanup migration
 * removes the old one, one upgrade later (server/docs/APP_DEFINITION_MIGRATIONS.md). When an app loads, the App Builder
 * drops the old place from memory, so release code only ever reads the new place: a reader that still uses the old
 * place fails in release N, not after the cleanup.
 *
 * Keyed by component type. Places use the widget definition's sections: properties, styles, general, generalStyles,
 * validation, others. Entries stay harmless once the cleanup has run.
 *
 * Example:
 *   SvgImage: [
 *     { from: ['styles', 'visibility'], to: ['properties', 'visibility'] },
 *     { from: ['general', 'tooltip'], to: ['properties', 'tooltip'] },
 *     { from: ['generalStyles', 'boxShadow'], to: ['styles', 'boxShadow'] },
 *   ],
 */
export const MOVED_COMPONENT_KEYS = {};
