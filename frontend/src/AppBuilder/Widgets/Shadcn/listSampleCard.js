// The List view's sample card (the components a new List view drops with) is laid out across a row: avatar, name over
// email, a badge and a button. In Grid layout the same row squashed into a narrow card, so switching the layout moves
// an untouched sample card into a stacked card (and back). A card the author has changed is left as it is.

// Layouts are in the item canvas's grid: left and width in columns of 43, top and height in px.
export const SAMPLE_CARD = {
  list: [
    { type: 'ShadAvatar', layout: { top: 16, left: 1, width: 3, height: 40 } },
    { type: 'ShadText', layout: { top: 14, left: 5, width: 20, height: 22 } },
    { type: 'ShadText', layout: { top: 36, left: 5, width: 20, height: 22 } },
    { type: 'ShadBadge', layout: { top: 24, left: 27, width: 7, height: 24 } },
    { type: 'ShadButton', layout: { top: 18, left: 35, width: 7, height: 36 } },
  ],
  grid: [
    { type: 'ShadAvatar', layout: { top: 16, left: 2, width: 10, height: 40 } },
    { type: 'ShadText', layout: { top: 66, left: 2, width: 39, height: 22 } },
    { type: 'ShadText', layout: { top: 88, left: 2, width: 39, height: 22 } },
    { type: 'ShadBadge', layout: { top: 120, left: 2, width: 20, height: 24 } },
    { type: 'ShadButton', layout: { top: 154, left: 2, width: 39, height: 36 } },
  ],
};

// The item height each arrangement needs.
export const SAMPLE_ITEM_HEIGHT = { list: 72, grid: 204 };

const sameBox = (a = {}, b = {}) => ['top', 'left', 'width', 'height'].every((key) => Number(a[key]) === Number(b[key]));

/** The new layouts ({ [id]: layout }) for a List view's children when its layout switches to `toMode`, or null when
 *  they are not the untouched sample card of the other layout. `children` is [{ id, type, layout }]. */
export const sampleCardLayouts = (children, toMode) => {
  const to = toMode === 'grid' ? 'grid' : 'list';
  const from = SAMPLE_CARD[to === 'grid' ? 'list' : 'grid'];
  if (!Array.isArray(children) || children.length !== from.length) return null;
  const left = [...children];
  const layouts = {};
  for (let i = 0; i < from.length; i += 1) {
    const at = left.findIndex((child) => child.type === from[i].type && sameBox(child.layout, from[i].layout));
    if (at < 0) return null;
    layouts[left[at].id] = { ...left[at].layout, ...SAMPLE_CARD[to][i].layout };
    left.splice(at, 1);
  }
  return layouts;
};
