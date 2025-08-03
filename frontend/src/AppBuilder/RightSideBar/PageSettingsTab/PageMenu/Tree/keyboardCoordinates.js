import { closestCorners, getFirstCollision, KeyboardCode } from '@dnd-kit/core';

import { getProjection } from './utilities';

const directions = [KeyboardCode.Down, KeyboardCode.Right, KeyboardCode.Up, KeyboardCode.Left];

const horizontal = [KeyboardCode.Left, KeyboardCode.Right];

export const sortableTreeKeyboardCoordinates =
  (context, indicator, indentationWidth) =>
  (event, { currentCoordinates, context: { active, over, collisionRect, droppableRects, droppableContainers } }) => {
    if (directions.includes(event.code)) {
      if (!active || !collisionRect) {
        return;
      }

      event.preventDefault();

      const {
        current: { items, offset },
      } = context;

      if (horizontal.includes(event.code) && over?.id) {
        const { depth, maxDepth, minDepth } = getProjection(items, active.id, over.id, offset, indentationWidth);

        switch (event.code) {
          case KeyboardCode.Left:
            if (depth > minDepth) {
              return {
                ...currentCoordinates,
                x: currentCoordinates.x - indentationWidth,
              };
            }
            break;
          case KeyboardCode.Right:
            if (depth < maxDepth) {
              return {
                ...currentCoordinates,
                x: currentCoordinates.x + indentationWidth,
              };
            }
            break;
        }

        return undefined;
      }

      const containers = [];

      droppableContainers.forEach((container) => {
        if (container?.disabled || container.id === over?.id) {
          return;
        }

        const rect = droppableRects.get(container.id);

        if (!rect) {
          return;
        }

        switch (event.code) {
          case KeyboardCode.Down:
            if (collisionRect.top < rect.top) {
              containers.push(container);
            }
            break;
          case KeyboardCode.Up:
            if (collisionRect.top > rect.top) {
              containers.push(container);
            }
            break;
        }
      });

      const collisions = closestCorners({
        active,
        collisionRect,
        pointerCoordinates: null,
        droppableRects,
        droppableContainers: containers,
      });
      let closestId = getFirstCollision(collisions, 'id');

      if (closestId === over?.id && collisions.length > 1) {
        closestId = collisions[1].id;
      }

      if (closestId && over?.id) {
        const activeRect = droppableRects.get(active.id);
        const newRect = droppableRects.get(closestId);
        const newDroppable = droppableContainers.get(closestId);

        if (activeRect && newRect && newDroppable) {
          const newIndex = items.findIndex(({ id }) => id === closestId);
          const newItem = items[newIndex];
          const activeIndex = items.findIndex(({ id }) => id === active.id);
          const activeItem = items[activeIndex];

          if (newItem && activeItem) {
            const { depth } = getProjection(
              items,
              active.id,
              closestId,
              (newItem.depth - activeItem.depth) * indentationWidth,
              indentationWidth
            );
            const isBelow = newIndex > activeIndex;
            const modifier = isBelow ? 1 : -1;
            const offset = indicator ? (collisionRect.height - activeRect.height) / 2 : 0;

            const newCoordinates = {
              x: newRect.left + depth * indentationWidth,
              y: newRect.top + modifier * offset,
            };

            return newCoordinates;
          }
        }
      }
    }

    return undefined;
  };
