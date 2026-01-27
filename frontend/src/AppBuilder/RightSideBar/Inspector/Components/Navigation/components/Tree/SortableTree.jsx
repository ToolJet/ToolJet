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
import { SortableTreeItem } from './components';
import { CustomPointerSensor } from './CustomSensor';
import { NavMenuItemGhost } from './NavMenuItemGhost';

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

export function SortableTree({
  menuItems,
  onReorder,
  onDeleteItem,
  onItemChange,
  getResolvedValue,
  collapsible = true,
  indicator = true,
  indentationWidth = 15,
  darkMode,
}) {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [groupToHighlight, setGroupToHighlight] = useState(null);
  const [dragDirection, setDragDirection] = useState(null);
  const intersections = useRef(null);

  // Build tree from menuItems
  useEffect(() => {
    setItems(menuItems);
  }, [menuItems]);

  // Flatten tree for rendering (with depth info)
  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);
    const collapsedItems = flattenedTree.reduce(
      (acc, { children, collapsed, id }) => (collapsed && children?.length ? [...acc, id] : acc),
      []
    );
    return removeChildrenOf(flattenedTree, activeId ? [activeId, ...collapsedItems] : collapsedItems);
  }, [activeId, items]);

  // Calculate projection (where item will land)
  const projected =
    activeId && overId
      ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth, intersections.current)
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
  function customCollisionDetection({
    active,
    collisionRect,
    droppableRects,
    droppableContainers,
    pointerCoordinates,
  }) {
    try {
      const activeItemIsGroup = flattenedItems.find(({ id }) => id === active.id)?.isGroup;
      let filteredDroppables = droppableContainers;

      // If manipulating a group, filter out nested items before calculating collision
      if (activeItemIsGroup) {
        if (dragDirection === 'up') {
          // Remove all items which are inside of a group
          filteredDroppables = droppableContainers.filter((droppable) => {
            const droppableItem = flattenedItems.find(({ id }) => id === droppable.id);
            if (droppableItem?.parentId) return false;
            return true;
          });
        } else {
          // If group is expanded, filter out all children from droppable containers
          const idsToInclude = [active.id];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.isGroup) {
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
      if (
        projected?.parentId &&
        intersectionOverlaps &&
        intersectionOverlaps.find((overlap) => overlap.id === projected?.parentId)
      ) {
        setGroupToHighlight(projected.parentId);
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
      const { depth, parentId } = projected;
      const parentGroup = items.find(({ id }) => id === parentId);
      const clonedItems = JSON.parse(JSON.stringify(flattenTree(items)));
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);

      // Safety check: ensure we found both indices
      if (activeIndex === -1 || overIndex === -1) {
        return;
      }

      const activeTreeItem = clonedItems[activeIndex];
      clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      let newItems = buildTree(sortedItems);

      // If dropping into a collapsed group, expand it
      if (parentGroup?.collapsed && parentId) {
        newItems = setProperty(newItems, parentId, 'collapsed', () => false);
      }

      // Update local state immediately for responsive UI (like Pages panel)
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
        <ul className="nav-menu-items-container" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
                onDeleteItem={onDeleteItem}
                onItemChange={onItemChange}
                getResolvedValue={getResolvedValue}
              />
            );
          })}
        </ul>
        {createPortal(
          <DragOverlay dropAnimation={dropAnimationConfig} modifiers={indicator ? [adjustTranslate] : undefined}>
            {activeId && activeItem ? (
              <NavMenuItemGhost darkMode={darkMode} item={activeItem} getResolvedValue={getResolvedValue} />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </DndContext>
  );
}
