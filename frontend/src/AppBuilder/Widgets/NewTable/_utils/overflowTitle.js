/**
 * `onMouseEnter` handler for text that may be cut off with an ellipsis: while it is, the whole text is its
 * `title`, so hovering shows it. A box whose text fits has no title.
 */
export const showTitleWhenClipped = ({ currentTarget: element }) => {
  const text = element.tagName === 'INPUT' ? element.value : element.textContent;
  if (text && element.scrollWidth - element.clientWidth > 0.5) element.setAttribute('title', text);
  else element.removeAttribute('title');
};

/**
 * The same for a box that holds the cut-off text in a child (a select's value, with its search input laid over
 * it, so the pointer never reaches the value itself): the box gets the title while `selector`'s element is clipped.
 */
export const showTitleOfClippedChild = (selector) => (event) => {
  const box = event.currentTarget;
  const child = box.querySelector(selector);
  if (child?.textContent && child.scrollWidth - child.clientWidth > 0.5) box.setAttribute('title', child.textContent);
  else box.removeAttribute('title');
};
