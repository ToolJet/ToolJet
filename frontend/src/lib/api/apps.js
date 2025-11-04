/**
 * @typedef {Object} AppRow
 * @property {string|number} id - Unique identifier of the app
 * @property {string} name - Display name of the app
 * @property {string|number|Date} lastEdited - Last edited timestamp (ISO string, epoch, or Date)
 * @property {string} editedBy - Display name (or id) of the last editor
 * // Optionally extend with: ownerId, tags, favorite, permissions, etc.
 */

// This module intentionally contains only the data contract for now.
// Fetchers and schema validation will be added in a later phase.

export const __apps_contract__ = true;


