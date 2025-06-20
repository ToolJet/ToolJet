import React, { useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import { createPortal } from 'react-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
  defaultDropAnimation,
  rectIntersection,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { buildTree, flattenTree, getProjection, removeChildrenOf, setProperty } from './utilities';
import { SortableTreeItem } from './components';
import { CSS } from '@dnd-kit/utilities';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { PageMenuItemGhost } from '../PageMenuItemGhost';

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

export function SortableTree({ collapsible, indicator = false, indentationWidth = 15, darkMode }) {
  const reorderPages = useStore((state) => state.reorderPages);
  const debouncedReorderPages = _.debounce(reorderPages, 500);

  const allpages = useStore((state) => _.get(state, 'modules.canvas.pages', []), shallow);

  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [saveNewList, setSaveNewList] = useState(false);
  // page group to highlight is the id of page gorup that is highlighted when dragging a page over it
  const [pageGroupToHighlight, setPageGroupToHighlight] = useState(null);
  const [dragDirection, setDragDirection] = useState(null);
  // intersections is an array of containers with which the active item intersects <[container_id,value]>[]
  const intersections = useRef(null);

  useEffect(() => {
    setItems(buildTree(allpages));
  }, [allpages]);

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);

    if (saveNewList) {
      debouncedReorderPages(flattenedTree);
      setSaveNewList(false);
    }
    const collapsedItems = flattenedTree.reduce(
      (acc, { children, collapsed, id }) => (collapsed && children.length ? [...acc, id] : acc),
      []
    );

    const toReturn = removeChildrenOf(flattenedTree, activeId ? [activeId, ...collapsedItems] : collapsedItems);

    return toReturn;
  }, [activeId, items]);

  const projected =
    activeId && overId
      ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth, intersections.current)
      : null;

  const sensorContext = useRef({
    items: flattenedItems,
    offset: offsetLeft,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 150 },
    })
  );

  // const disabledBorder = useMemo(() => {
  //   const isActiveItemPageGroup = activeId && allpages.find(({ id }) => id === activeId)?.isPageGroup;
  //   const isOverItemAPageGroupMember = overId && allpages.find(({ id }) => id === overId)?.pageGroupId;
  //   if (isActiveItemPageGroup && isOverItemAPageGroupMember) {
  //     return true;
  //   }
  //   return false;
  // }, [activeId, overId]);

  // if (disabledBorder) {
  //   // make cursor not-allowed
  //   document.body.style.setProperty('cursor', 'not-allowed');
  // } else {
  //   document.body.style.setProperty('cursor', '');
  // }

  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems]);
  const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null;
  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft,
    };
  }, [flattenedItems, offsetLeft]);

  // const pageGroupToHighlight = useMemo(() => {
  //   return;
  //   // only do highlighting if page group has no children or is collapsed
  //   // if (!projected?.pageGroupId) return;
  //   // const pageGroup = items.find((item) => item.id === projected.pageGroupId);
  //   // if (overId === projected?.pageGroupId) return projected?.pageGroupId;
  //   // // over is one of a child item of this page Group
  //   // return projected?.pageGroupId;
  // }, [projected]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={(args) => handleDragMove(args, setDragDirection)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        {flattenedItems.map((data) => {
          const { id, children, collapsed, depth } = data;

          return (
            <SortableTreeItem
              key={id}
              overId={overId}
              pageGroupToHighlight={pageGroupToHighlight}
              disabledBorder={false}
              darkMode={darkMode}
              id={id}
              value={data}
              activeId={activeId}
              depth={id === activeId && projected ? projected.depth : depth}
              indentationWidth={indentationWidth}
              indicator={indicator}
              collapsed={Boolean(collapsed && children.length)}
              onCollapse={collapsible && children.length ? () => handleCollapse(id) : () => {}}
            />
          );
        })}
        {createPortal(
          <DragOverlay dropAnimation={dropAnimationConfig} modifiers={indicator ? [adjustTranslate] : undefined}>
            {activeId && activeItem ? <PageMenuItemGhost darkMode={darkMode} page={activeItem} /> : null}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </DndContext>
  );

  function customCollisionDetection({
    active,
    collisionRect,
    droppableRects,
    droppableContainers,
    pointerCoordinates,
  }) {
    try {
      const allPages = useStore.getState().modules.canvas.pages || [];
      const activeItemIsPageGroup = allPages.find(({ id }) => id === active.id)?.isPageGroup;
      let filteredDroppables = droppableContainers;
      // if manipulating a page group, filter out nested pages before calculating collision without page groups because they are not droppable
      if (activeItemIsPageGroup) {
        if (dragDirection === 'up') {
          // remove all pages which are not page groups but are inside of a pageGroups
          filteredDroppables = droppableContainers.filter((droppable) => {
            const droppableItem = allPages.find(({ id }) => id === droppable.id);
            if (droppableItem?.pageGroupId) return false;
            return true;
          });
        } else {
          // if page group is expanded, filter out all children from droppable containers
          const idsToInclude = [active.id];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.isPageGroup) {
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
      // keep track of intersections for highlighting page groups and calculating projection
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
          .filter(([id]) => id != activeId);
      }

      if (
        projected?.pageGroupId &&
        intersectionOverlaps &&
        intersectionOverlaps.find((overlap) => overlap.id === projected?.pageGroupId)
      ) {
        setPageGroupToHighlight(projected.pageGroupId);
      } else {
        setPageGroupToHighlight(null);
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

  function handleDragMove({ delta }, setDragDirection) {
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
    // debugger;
    resetState();
    if (projected && over) {
      const { depth, pageGroupId } = projected;
      const pageGroup = items.find(({ id }) => id === pageGroupId);
      const clonedItems = JSON.parse(JSON.stringify(flattenTree(items)));
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];

      clonedItems[activeIndex] = { ...activeTreeItem, depth, pageGroupId };

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      setSaveNewList(true);
      const newItems = buildTree(sortedItems);
      setItems(newItems);
      if (pageGroup?.collapsed) {
        handleCollapse(pageGroupId);
      }
    }
  }

  function handleDragCancel() {
    resetState();
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    setPageGroupToHighlight(null);
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
}

const adjustTranslate = ({ transform }) => {
  return {
    ...transform,
    y: transform.y - 15,
  };
};
