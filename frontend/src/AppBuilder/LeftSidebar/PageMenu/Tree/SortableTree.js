import React, { useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import { createPortal } from 'react-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
  defaultDropAnimation,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { buildTree, flattenTree, getProjection, removeChildrenOf, setProperty } from './utilities';
import { sortableTreeKeyboardCoordinates } from './keyboardCoordinates';
import { SortableTreeItem } from './components';
import { CSS } from '@dnd-kit/utilities';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { PageMenuItemGhost } from '../PageMenuItemGhost';

const DndOverlayComponent = () => {
  return (
    <div
      style={{
        height: 2,
        width: 100,
        background: 'red',
      }}
    ></div>
  );
};

export const DraggableElement = ({ onCollapse, data }) => {
  return (
    <div>
      <button onClick={onCollapse ? onCollapse : undefined}>c</button>
      {data}
    </div>
  );
};

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

export function SortableTree({ collapsible, indicator = false, indentationWidth = 15 }) {
  const reorderPages = useStore((state) => state.reorderPages);
  const allpages = useStore((state) => _.get(state, 'modules.canvas.pages', []), shallow);
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [saveNewList, setSaveNewList] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    setItems(buildTree(allpages));
  }, [allpages]);

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);
    if (saveNewList) {
      reorderPages(flattenedTree);
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
    activeId && overId ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth) : null;
  const sensorContext = useRef({
    items: flattenedItems,
    offset: offsetLeft,
  });
  const [coordinateGetter] = useState(() =>
    sortableTreeKeyboardCoordinates(sensorContext, indicator, indentationWidth)
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 150 },
    })
    // useSensor(KeyboardSensor, {
    //   coordinateGetter,
    // })
  );

  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems]);
  const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null;

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft,
    };
  }, [flattenedItems, offsetLeft]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
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
              id={id}
              value={data}
              depth={id === activeId && projected ? projected.depth : depth}
              indentationWidth={indentationWidth}
              indicator={indicator}
              collapsed={Boolean(collapsed && children.length)}
              // onRemove={removable ? () => handleRemove(id) : undefined}
              onCollapse={collapsible && children.length ? () => handleCollapse(id) : undefined}
            />
          );
        })}
        {createPortal(
          <DragOverlay dropAnimation={dropAnimationConfig} modifiers={indicator ? [adjustTranslate] : undefined}>
            {activeId && activeItem ? <PageMenuItemGhost page={activeItem} /> : null}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </DndContext>
  );

  function handleDragStart({ active: { id: activeId } }) {
    setActiveId(activeId);
    setOverId(activeId);

    const activeItem = flattenedItems.find(({ id }) => id === activeId);

    if (activeItem) {
      setCurrentPosition({
        pageGroupId: activeItem.pageGroupId,
        overId: activeId,
      });
    }

    document.body.style.setProperty('cursor', 'grabbing');
  }

  function handleDragMove({ delta }) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }) {
    setOverId(over?.id ?? null);
  }

  function handleDragEnd({ active, over }) {
    resetState();
    // debugger;
    if (projected && over) {
      const { depth, pageGroupId } = projected;
      const clonedItems = JSON.parse(JSON.stringify(flattenTree(items)));
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];

      clonedItems[activeIndex] = { ...activeTreeItem, depth, pageGroupId };

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      reorderPages(sortedItems);
      // debugger;
      const newItems = buildTree(sortedItems);

      setItems(newItems);
      setSaveNewList(true);
    }
  }

  function handleDragCancel() {
    resetState();
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    setCurrentPosition(null);

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
