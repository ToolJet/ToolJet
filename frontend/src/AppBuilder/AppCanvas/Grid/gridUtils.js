import { useGridStore } from '@/_stores/gridStore';
import { isEmpty } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';

export function correctBounds(layout, bounds) {
  layout = scaleLayouts(layout);
  const collidesWith = [];
  for (let i = 0, len = layout.length; i < len; i++) {
    const l = layout[i];
    // Overflows right
    if (l.left + l.width > bounds.cols) l.left = bounds.cols - l.width;
    // Overflows left
    if (l.left < 0) {
      l.left = 0;
      l.width = bounds.cols;
    }
    if (!l.static) collidesWith.push(l);
    else {
      // If this is static and collides with other statics, we must move it down.
      // We have to do something nicer than just letting them overlap.
      while (getFirstCollision(collidesWith, l)) {
        l.top++;
      }
    }
  }
  return removePaddingLeft(layout);
}

function removePaddingLeft(layouts) {
  return layouts.map((layout) => {
    if (layout.left == 1) {
      if (!layouts.find((l) => l.top > layout.top && l.top < layout.top + layout.height && l.left < 1)) {
        return { ...layout, left: 0 };
      }
    }
    return { ...layout };
  });
}

function collides(l1, l2) {
  if (l1.i === l2.i) return false; // same element
  if (l1.left + l1.width <= l2.left) return false; // l1 is left of l2
  if (l1.left >= l2.left + l2.width) return false; // l1 is right of l2
  if (l1.top + l1.height <= l2.top) return false; // l1 is above l2
  if (l1.top >= l2.top + l2.height) return false; // l1 is below l2
  return true; // boxes overlap
}

function getFirstCollision(layout, layoutItem) {
  for (let i = 0, len = layout.length; i < len; i++) {
    const isCollides = collides(layout[i], layoutItem);
    if (isCollides) return layout[i];
  }
  return null; // Return null if there's no collision
}

export function compact(layout, compactType = 'vertical', cols = 20, allowOverlap = false) {
  // Statics go in the compareWith array right away so items flow around them.
  const compareWith = getStatics(layout);
  // We go through the items by row and column.
  const sorted = sortLayoutItems(layout, compactType);
  // Holding for new items.
  const out = new Array(layout.length);

  for (let i = 0, len = sorted.length; i < len; i++) {
    let l = cloneLayoutItem(sorted[i]);

    // Don't move static elements
    if (!l.static) {
      l = compactItem(compareWith, l, compactType, cols, sorted, allowOverlap);

      // Add to comparison array. We only collide with items before this one.
      // Statics are already in this array.
      compareWith.push(l);
    }

    // Add to output array to make sure they still come out in the right order.
    out[layout.indexOf(sorted[i])] = l;

    // Clear moved flag, if it exists.
    l.moved = false;
  }

  return out;
}

export function getStatics(layout) {
  return layout.filter((l) => l.static);
}

// Fast path to cloning, since this is monomorphic
export function cloneLayoutItem(layoutItem) {
  return {
    width: layoutItem.width,
    height: layoutItem.height,
    left: layoutItem.left,
    top: layoutItem.top,
    i: layoutItem.i,
    minW: layoutItem.minW,
    maxW: layoutItem.maxW,
    minH: layoutItem.minH,
    maxH: layoutItem.maxH,
    moved: Boolean(layoutItem.moved),
    static: Boolean(layoutItem.static),
    // These can be null/undefined
    isDraggable: layoutItem.isDraggable,
    isResizable: layoutItem.isResizable,
    resizeHandles: layoutItem.resizeHandles,
    isBounded: layoutItem.isBounded,
  };
}

function compactItem(compareWith, l, compactType, cols, fullLayout, allowOverlap) {
  const compactV = compactType === 'vertical';
  const compactH = compactType === 'horizontal';
  if (compactV) {
    // Bottom 'top' possible is the bottom of the layout.
    // This allows you to do nice stuff like specify {top: Infinity}
    // This is here because the layout must be sorted in order to get the correct bottom `top`.
    const bottomPos = bottom(compareWith);
    l.top = Math.min(bottomPos, l.top);
    // Move the element up as far as it can go without colliding.
    while (l.top > 0 && !getFirstCollision(compareWith, l)) {
      l.top--;
    }
  } else if (compactH) {
    // Move the element left as far as it can go without colliding.
    while (l.left > 0 && !getFirstCollision(compareWith, l)) {
      l.left--;
    }
  }

  // Move it down, and keep moving it down if it's colliding.
  let collides;
  // Checking the compactType null value to avoid breaking the layout when overlapping is allowed.
  while ((collides = getFirstCollision(compareWith, l)) && !(compactType === null && allowOverlap)) {
    if (compactH) {
      resolveCompactionCollision(fullLayout, l, collides.left + collides.width, 'x');
    } else {
      resolveCompactionCollision(fullLayout, l, collides.top + collides.height, 'top');
    }
    // Since we can't grow without bounds horizontally, if we've overflown, let's move it down and try again.
    if (compactH && l.left + l.width > cols) {
      l.left = cols - l.width;
      l.top++;
      // Also move the element as left as we can
      while (l.left > 0 && !getFirstCollision(compareWith, l)) {
        l.left--;
      }
    }
  }

  // Ensure that there are no negative positions
  l.top = Math.max(l.top, 0);
  l.left = Math.max(l.left, 0);

  return l;
}

export function bottom(layout) {
  let max = 0,
    bottomY;
  for (let i = 0, len = layout.length; i < len; i++) {
    bottomY = layout[i].top + layout[i].height;
    if (bottomY > max) max = bottomY;
  }
  return max;
}

function resolveCompactionCollision(layout, item, moveToCoord, axis) {
  const sizeProp = heightWidth[axis];
  item[axis] += 1;
  const itemIndex = layout
    .map((layoutItem) => {
      return layoutItem.i;
    })
    .indexOf(item.i);

  // Go through each item we collide with.
  for (let i = itemIndex + 1; i < layout.length; i++) {
    const otherItem = layout[i];
    // Ignore static items
    if (otherItem.static) continue;

    // Optimization: we can break early if we know we're past this el
    // We can do this b/c it's a sorted layout
    if (otherItem.top > item.top + item.height) break;

    if (collides(item, otherItem)) {
      resolveCompactionCollision(layout, otherItem, moveToCoord + item[sizeProp], axis);
    }
  }

  item[axis] = moveToCoord;
}

const heightWidth = { x: 'width', y: 'height' };

function sortLayoutItems(layout, compactType) {
  if (compactType === 'horizontal') return sortLayoutItemsByColRow(layout);
  if (compactType === 'vertical') return sortLayoutItemsByRowCol(layout);
  else return layout;
}

function sortLayoutItemsByColRow(layout) {
  return layout.slice(0).sort(function (a, b) {
    if (a.left > b.left || (a.left === b.left && a.top > b.top)) {
      return 1;
    }
    return -1;
  });
}

/**
 * Sort layout items by top ascending and left ascending.
 *
 * Does not modify the original layout.
 */
function sortLayoutItemsByRowCol(layout) {
  // Slice to clone the array as sort modifies the original array
  return layout.slice(0).sort(function (a, b) {
    if (a.top > b.top || (a.top === b.top && a.left > b.left)) {
      return 1;
    } else if (a.top === b.top && a.left === b.left) {
      // Without this, we can get different sort results in IE vs. Chrome/FF
      return 0;
    }
    return -1;
  });
}

function scaleLayouts(layouts, cols = 6) {
  return layouts.map((layout) => ({
    ...layout,
    // width: layout.width <= 4 ? 2 : layout.width <= 8 ? 3 : layout.width,
    // width: layout.width <= 10 ? 10 : layout.width <= 20 ? 24 : 43,
    width: layout.width * 3 > 43 ? 43 : layout.width * 3,
  }));
}

export const individualGroupableProps = (element) => {
  if (element?.classList.contains('target2')) {
    return {
      resizable: false,
    };
  }
};

export const handleWidgetResize = (e, list, boxes, gridWidth) => {
  const currentLayout = list.find(({ id }) => id === e.target.id);
  const currentWidget = boxes.find(({ id }) => id === e.target.id);
  let _gridWidth = useGridStore.getState().subContainerWidths[currentWidget.component?.parent] || gridWidth;
  document.getElementById('canvas-' + currentWidget.component?.parent)?.classList.add('show-grid');
  const currentWidth = currentLayout.width * _gridWidth;
  const diffWidth = e.width - currentWidth;
  const diffHeight = e.height - currentLayout.height;
  const isLeftChanged = e.direction[0] === -1;
  const isTopChanged = e.direction[1] === -1;

  let transformX = currentLayout.left * _gridWidth;
  let transformY = currentLayout.top;
  if (isLeftChanged) {
    transformX = currentLayout.left * _gridWidth - diffWidth;
  }
  if (isTopChanged) {
    transformY = currentLayout.top - diffHeight;
  }

  const elemContainer = e.target.closest('.real-canvas');
  const containerHeight = elemContainer.clientHeight;
  const containerWidth = elemContainer.clientWidth;
  const maxY = containerHeight - e.target.clientHeight;
  const maxLeft = containerWidth - e.target.clientWidth;
  const maxWidthHit = transformX < 0 || transformX >= maxLeft;
  const maxHeightHit = transformY < 0 || transformY >= maxY;
  transformY = transformY < 0 ? 0 : transformY > maxY ? maxY : transformY;
  transformX = transformX < 0 ? 0 : transformX > maxLeft ? maxLeft : transformX;

  if (!maxWidthHit || e.width < e.target.clientWidth) {
    e.target.style.width = `${e.width}px`;
  }
  if (!maxHeightHit || e.height < e.target.clientHeight) {
    e.target.style.height = `${e.height}px`;
  }
  e.target.style.transform = `translate(${transformX}px, ${transformY}px)`;
};

export function getMouseDistanceFromParentDiv(event, id, parentWidgetType) {
  let parentDiv = id
    ? typeof id === 'string'
      ? document.getElementById(id)
      : id
    : document.getElementsByClassName('real-canvas')[0];
  parentDiv = id === 'real-canvas' ? document.getElementById('real-canvas') : document.getElementById('canvas-' + id);
  if (parentWidgetType === 'Container' || parentWidgetType === 'Modal') {
    parentDiv = document.getElementById('canvas-' + id);
  }
  // Get the bounding rectangle of the parent div.
  const parentDivRect = parentDiv.getBoundingClientRect();
  const targetDivRect = event.target.getBoundingClientRect();

  const mouseX = targetDivRect.left - parentDivRect.left;
  const mouseY = targetDivRect.top - parentDivRect.top;

  // Calculate the distance from the mouse pointer to the top and left edges of the parent div.
  const top = mouseY;
  const left = mouseX;

  return { top, left };
}

export function findHighestLevelofSelection(_selectedComponents) {
  const selectedComponents = _selectedComponents || useStore.getState().getSelectedComponentsDefinition();
  let result = [];
  if (selectedComponents.some((widget) => !widget?.component?.parent)) {
    result = selectedComponents.filter((widget) => !widget?.component?.parent);
  } else {
    result = selectedComponents.filter(
      (widget) => widget?.component?.parent === selectedComponents[0]?.component?.parent
    );
  }
  return result;
}

export function findChildrenAndGrandchildren(parentId, widgets) {
  if (isEmpty(widgets)) {
    return [];
  }
  const children = widgets.filter((widget) => widget?.component?.parent?.startsWith(parentId));
  let result = [];
  for (const child of children) {
    result.push(child.id);
    result = result.concat(...findChildrenAndGrandchildren(child.id, widgets));
  }
  return result;
}

export function adjustWidth(width, posX, gridWidth) {
  posX = Math.round(posX / gridWidth);
  width = Math.round(width / gridWidth);
  if (posX + width > 43) {
    width = 43 - posX;
  }
  return width * gridWidth;
}

export function getPositionForGroupDrag(events, parentWidth, parentHeight) {
  return events.reduce((positions, ev) => {
    const eventObj = ev.lastEvent ? ev.lastEvent : ev;
    const { width, height } = eventObj;

    const {
      translate: [elemPosX, elemPosY],
    } = eventObj.drag ? eventObj.drag : eventObj;

    return {
      ...positions,
      posRight: Math.min(
        positions.posRight ?? Infinity, // Handle potential initial undefined value
        parentWidth - (width + elemPosX)
      ),
      posBottom: Math.min(positions.posBottom ?? Infinity, parentHeight - (height + elemPosY)),
      posLeft: Math.min(positions.posLeft ?? Infinity, elemPosX),
      posTop: Math.min(positions.posTop ?? Infinity, elemPosY),
    };
  }, {});
}

export function getOffset(childElement, grandparentElement) {
  if (!childElement || !grandparentElement) return null;

  // Get bounding rectangles for both elements
  const childRect = childElement.getBoundingClientRect();
  const grandparentRect = grandparentElement.getBoundingClientRect();

  // Calculate offset by subtracting grandparent's position from child's position
  const offsetX = childRect.left - grandparentRect.left;
  const offsetY = childRect.top - grandparentRect.top;

  return { x: offsetX, y: offsetY };
}

export function hasParentWithClass(child, className) {
  let currentElement = child;

  while (currentElement !== null && currentElement !== document.documentElement) {
    if (currentElement.classList.contains(className)) {
      return true;
    }
    currentElement = currentElement.parentElement;
  }

  return false;
}
