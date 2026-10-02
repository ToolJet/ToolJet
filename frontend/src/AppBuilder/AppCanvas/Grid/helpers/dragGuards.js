/**
 * The class ConfigHandle renders on its root element.
 *
 * Widgets with interactive interiors (range sliders, the BoundedBox annotation
 * canvas, a table's column headers) opt out of body-drags so those interiors
 * stay usable, and the config handle above the widget is the escape hatch that
 * still moves them. Guarding on the handle's class is what makes that work.
 *
 * This used to read 'handle-content', a class on a badge inside the handle.
 * That badge was replaced by ConfigHandleButton in 84b8d29f49 and the class
 * disappeared, but the guard kept looking for it — so the escape hatch could
 * never be found and those widgets became completely undraggable.
 */
export const CONFIG_HANDLE_CLASS = 'config-handle';

/**
 * True when the config handle is somewhere under the pointer.
 *
 * `elements` is a document.elementsFromPoint() result: the topmost element at
 * the point followed by its ancestors. Because ancestors are included, testing
 * for the handle's own class also covers everything nested inside it (the
 * button, the badge, the dynamic-height popover trigger) without this guard
 * needing to know about any of them.
 */
export function isDragFromConfigHandle(elements) {
  if (!elements?.length) return false;

  return Array.from(elements).some((element) => element?.classList?.contains(CONFIG_HANDLE_CLASS));
}
