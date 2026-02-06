import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
  defaultDropAnimation,
  rectIntersection,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { buildTree, flattenTree, getProjection, removeChildrenOf, setProperty } from './utilities';
import { SortableTreeItem } from './SortableTreeItem';
import { CustomPointerSensor } from './CustomSensor';

const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

const dropAnimationConfig = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5,
        }),
      },
    ];
  },
  easing: 'ease-out',
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    });
  },
};

const adjustTranslate = ({ transform }) => {
  return {
    ...transform,
    y: transform.y - 15,
  };
};

// Default property names
const DEFAULT_PROPERTY_NAMES = {
  isGroup: 'isGroup',
  parentId: 'parentId',
};

export function SortableTree({
  items: inputItems,
  onReorder,
  renderItem,
  renderGhost,
  propertyNames = DEFAULT_PROPERTY_NAMES,
  collapsible = true,
  indicator = true,
  indentationWidth = 15,
  darkMode,
  // Additional props to pass through to items
  ...restProps
}) {
  const { isGroup: isGroupKey, parentId: parentIdKey } = propertyNames;

  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [groupToHighlight, setGroupToHighlight] = useState(null);
  const [dragDirection, setDragDirection] = useState(null);
  const intersections = useRef(null);

  // Build tree from input items
  useEffect(() => {
    if (Array.isArray(inputItems)) {
      // Check if items are already in tree format (have children) or flat format
      const hasNestedChildren = inputItems.some((item) => item.children?.length > 0);
      if (hasNestedChildren) {
        setItems(inputItems);
      } else {
        // Build tree from flat items
        setItems(buildTree(inputItems, propertyNames));
      }
    }
  }, [inputItems, propertyNames]);

  // Flatten tree for rendering (with depth info)
  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items, propertyNames);
    const collapsedItems = flattenedTree.reduce(
      (acc, item) => (item.collapsed && item.children?.length ? [...acc, item.id] : acc),
      []
    );
    return removeChildrenOf(flattenedTree, activeId ? [activeId, ...collapsedItems] : collapsedItems, propertyNames);
  }, [activeId, items, propertyNames]);

  // Calculate projection (where item will land)
  const projected =
    activeId && overId
      ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth, intersections.current, propertyNames)
      : null;

  const sensors = useSensors(
    useSensor(CustomPointerSensor, {
      activationConstraint: {
        delay: 250,
        distance: 10,
      },
    })
  );

  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems]);
  const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null;

  // Custom collision detection for groups
  function customCollisionDetection({ active, collisionRect, droppableRects, droppableContainers, pointerCoordinates }) {
    try {
      const activeItemIsGroup = flattenedItems.find(({ id }) => id === active.id)?.[isGroupKey];
      let filteredDroppables = droppableContainers;

      // If manipulating a group, filter out nested items before calculating collision
      if (activeItemIsGroup) {
        if (dragDirection === 'up') {
          // Remove all items which are inside of a group
          filteredDroppables = droppableContainers.filter((droppable) => {
            const droppableItem = flattenedItems.find(({ id }) => id === droppable.id);
            if (droppableItem?.[parentIdKey]) return false;
            return true;
          });
        } else {
          // If group is expanded, filter out all children from droppable containers
          const idsToInclude = [active.id];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item[isGroupKey]) {
              const children = item.children;
              if (children?.length > 0 && !item.collapsed) {
                idsToInclude.push(children[children.length - 1].id);
              } else {
                idsToInclude.push(item?.id);
              }
            } else {
              idsToInclude.push(item?.id);
            }
          }
          filteredDroppables = droppableContainers.filter((droppable) => idsToInclude.includes(droppable.id));
        }
      }

      // Keep track of intersections for highlighting groups and calculating projection
      const intersectionOverlaps = rectIntersection({
        active,
        collisionRect,
        droppableRects,
        droppableContainers: filteredDroppables,
        pointerCoordinates,
      });

      if (intersections) {
        intersections.current = intersectionOverlaps
          .map((overlap) => [overlap?.id, overlap?.data?.value])
          .filter(([id]) => id !== activeId);
      }

      // Highlight group when dragging over it
      const projectedParentId = projected?.[parentIdKey];
      if (projectedParentId && intersectionOverlaps && intersectionOverlaps.find((overlap) => overlap.id === projectedParentId)) {
        setGroupToHighlight(projectedParentId);
      } else {
        setGroupToHighlight(null);
      }

      return closestCenter({
        active,
        collisionRect,
        droppableRects,
        droppableContainers: filteredDroppables,
        pointerCoordinates,
      });
    } catch (error) {
      return [];
    }
  }

  function handleDragStart({ active: { id: activeId } }) {
    setActiveId(activeId);
    setOverId(activeId);
    document.body.style.setProperty('cursor', 'grabbing');
  }

  function handleDragMove({ delta }) {
    if (delta.y > 0) {
      setDragDirection('down');
    }
    if (delta.y < 0) {
      setDragDirection('up');
    }
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }) {
    setOverId(over?.id ?? null);
  }

  function handleDragEnd({ active, over }) {
    resetState();

    if (projected && over) {
      const depth = projected.depth;
      const parentId = projected[parentIdKey];
      const parentGroup = items.find(({ id }) => id === parentId);
      const clonedItems = JSON.parse(JSON.stringify(flattenTree(items, propertyNames)));
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);

      // Safety check: ensure we found both indices
      if (activeIndex === -1 || overIndex === -1) {
        return;
      }

      const activeTreeItem = clonedItems[activeIndex];
      clonedItems[activeIndex] = { ...activeTreeItem, depth, [parentIdKey]: parentId };

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      let newItems = buildTree(sortedItems, propertyNames);

      // If dropping into a collapsed group, expand it
      if (parentGroup?.collapsed && parentId) {
        newItems = setProperty(newItems, parentId, 'collapsed', () => false);
      }

      // Update local state immediately for responsive UI
      setItems(newItems);

      // Notify parent to persist the change
      onReorder?.(newItems);
    }
  }

  function handleDragCancel() {
    resetState();
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    setGroupToHighlight(null);
    intersections.current = null;
    document.body.style.setProperty('cursor', '');
  }

  function handleCollapse(id) {
    setItems((items) =>
      setProperty(items, id, 'collapsed', (value) => {
        return !value;
      })
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        <ul className="sortable-tree-container" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {flattenedItems.map((data) => {
            const { id, children, collapsed, depth } = data;

            return (
              <SortableTreeItem
                key={id}
                id={id}
                value={data}
                groupToHighlight={groupToHighlight}
                darkMode={darkMode}
                depth={id === activeId && projected ? projected.depth : depth}
                indentationWidth={indentationWidth}
                indicator={indicator}
                collapsed={Boolean(collapsed && children?.length)}
                onCollapse={collapsible && children?.length ? () => handleCollapse(id) : () => {}}
                renderItem={renderItem}
                propertyNames={propertyNames}
                {...restProps}
              />
            );
          })}
        </ul>
        {createPortal(
          <DragOverlay dropAnimation={dropAnimationConfig} modifiers={indicator ? [adjustTranslate] : undefined}>
            {activeId && activeItem && renderGhost ? renderGhost(activeItem) : null}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </DndContext>
  );
}
