/**
 * fx expressions parked while fx is off, so toggling fx back on restores what the user wrote
 * instead of the literal that replaced it.
 *
 * Module-scoped rather than a store: nothing subscribes to it and no update ever needs to trigger a
 * render, so store machinery would only obscure that. Deliberately not persisted — recoverable only
 * until the tab reloads, which keeps the stash self-limiting and avoids a schema change on saved apps.
 */
const stash = new Map();

export const stashFxExpression = (key, expression) => {
  if (!key) return;
  stash.set(key, expression);
};

// Read-and-delete, so a restored expression cannot be re-applied by a later fx toggle.
export const takeFxExpression = (key) => {
  if (!key) return undefined;
  const expression = stash.get(key);
  stash.delete(key);
  return expression;
};

/**
 * Stash key for one field of one item in a list (options, columns, steps, tabs...).
 *
 * Keyed by the item's own id, never its position: a parked expression must not be handed to
 * whichever item later occupies that slot. `value`/`name`/`title` cover items saved before
 * ids were added; `index` is the last resort for lists with no identifier at all.
 */
export const getFxStashKey = ({ componentId, listName, item, index, property }) => {
  if (!componentId || !property) return undefined;
  const itemId = item?.id ?? item?.value ?? item?.name ?? item?.title ?? index;
  return `${componentId}-${listName}-${itemId}-${property}`;
};
