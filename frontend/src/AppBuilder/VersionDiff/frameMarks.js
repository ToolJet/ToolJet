// Marks changed widgets inside a compare frame (the viewer in an iframe), for the outlines and
// labels frameCss draws. Kept apart from the React component so the cost of a pass is testable:
// on a large diff the frame re-marks as widgets mount, and the pointer moves the hover often.

const setFlag = (element, name, on) => {
  if (on !== element.hasAttribute(name)) on ? element.setAttribute(name, '') : element.removeAttribute(name);
};

const setValue = (element, name, value) => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};

/**
 * One marking pass: every element of every changed widget gets its status, key and name (only
 * written when different), and the hover and selection. A widget's position is read once, when it
 * is first marked: getComputedStyle forces a style pass, and widgets re-mount as queries resolve.
 * Returns the keys of the widgets found.
 */
export function markFrame(d, highlights, { selectedKey = null, hoveredKey = null } = {}) {
  const found = new Set();
  for (const highlight of highlights) {
    if (!highlight.id) continue;
    const elements = d.querySelectorAll(`.ele-${CSS.escape(highlight.id)}`);
    elements.forEach((element) => {
      setValue(element, 'data-vd', highlight.status);
      setValue(element, 'data-vd-key', highlight.key);
      setValue(element, 'data-vd-name', highlight.name);
      setFlag(element, 'data-vd-weak', !!highlight.weak);
      if (!element.hasAttribute('data-vd-placed')) {
        if (d.defaultView.getComputedStyle(element).position === 'static') element.style.position = 'relative';
        element.setAttribute('data-vd-placed', '');
      }
      setFlag(element, 'data-vd-selected', highlight.key === selectedKey);
      setFlag(element, 'data-vd-hover', highlight.key === hoveredKey);
    });
    if (elements.length) found.add(highlight.key);
  }
  return found;
}

/** Moves the hover and selection among widgets already marked, without a marking pass. */
export function markState(d, selectedKey, hoveredKey) {
  d.querySelectorAll('[data-vd-key]').forEach((element) => {
    const key = element.getAttribute('data-vd-key');
    setFlag(element, 'data-vd-selected', key === selectedKey);
    setFlag(element, 'data-vd-hover', key === hoveredKey);
  });
}
