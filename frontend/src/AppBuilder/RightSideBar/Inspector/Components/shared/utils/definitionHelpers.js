/**
 * Returns the subset of `keys` present in the component's saved definition.properties.
 * Useful for gating a deprecated-properties section: only pre-existing components (whose deprecated keys
 * were backfilled via migration) carry them, while newly-dropped ones never seed those keys in the widget config.
 * @param {object} component - Inspector component object
 * @param {string[]} keys - Property keys to check
 * @returns {string[]} The subset of `keys` that exist in `component.component.definition.properties`
 */
export const getExistingDefinitionProperties = (component, keys = []) =>
  keys.filter((key) => component?.component?.definition?.properties?.[key] !== undefined);
