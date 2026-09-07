/**
 * Id of the tab one step from `currentTabId`, or null when there is none.
 *
 * Hidden (`visible === false`) and disabled (`disable` is truthy) tabs are
 * skipped, and the ends clamp rather than wrap — a null return means "stay put",
 * which lets the caller avoid firing onTabSwitch for a move that did not happen.
 *
 * @param {Array<{id: string|number, visible?: boolean, disable?: boolean}>} tabItems
 * @param {string|number} currentTabId
 * @param {'next'|'previous'} direction
 * @returns {string|number|null}
 */
export function resolveAdjacentTab(tabItems, currentTabId, direction) {
  const items = Array.isArray(tabItems) ? tabItems : [];
  const step = direction === 'previous' ? -1 : 1;
  const isNavigable = (tab) => Boolean(tab && tab.visible !== false && !tab.disable);

  // Loose comparison on purpose: a tab list built from code can carry numeric
  // ids while a configured one carries strings, and the widget compares with ==
  // almost everywhere else.
  // eslint-disable-next-line eqeqeq
  const currentIndex = items.findIndex((tab) => tab?.id == currentTabId);

  // An unknown current id (setTab does not validate) starts the scan from the
  // near end, so the action still does something sensible. A known one starts
  // from the neighbouring slot, which also steps off a tab that has since been
  // hidden.
  const start = currentIndex === -1 ? (step === 1 ? 0 : items.length - 1) : currentIndex + step;

  for (let index = start; index >= 0 && index < items.length; index += step) {
    if (isNavigable(items[index])) return items[index].id;
  }

  return null;
}
