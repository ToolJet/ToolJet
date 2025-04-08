import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { buildTree, flattenTree, getProjection, getChildCount, removeChildrenOf } from './utilities';
import { CSS } from '@dnd-kit/utilities';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { sortableTreeKeyboardCoordinates } from './keyboardCoordinates';

const initialItems = [];

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

export function SortableTree({
  collapsible,
  indicator = false,
  indentationWidth = 20,
  defaultItems,
  renderItem,
  renderGhostItem,
  onChange,
  isLicensed,
}) {
  const [items, setItems] = useState(() => initialItems);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState([]);
  const [saveNewList, setSaveNewList] = useState(false);

  const sanitizeData = useCallback(
    (data) => {
      return data.map((page) => {
        const { pageGroupId, children, depth, ...rest } = page;
        if (isLicensed) {
          return {
            ...rest,
            ...(!page['isPageGroup'] && {
              pageGroupId,
            }),
          };
        } else {
          return {
            ...rest,
          };
        }
      });
    },
    [isLicensed]
  );

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);
    const collapsedItems = flattenedTree.reduce(
      (acc, { children, id }) => (collapsedGroups.includes(id) && children.length ? [...acc, id] : acc),
      []
    );
    if (saveNewList) {
      onChange(sanitizeData(flattenedTree));
      setSaveNewList(false);
    }
    const newList = removeChildrenOf(flattenedTree, activeId ? [activeId, ...collapsedItems] : collapsedItems);
    return newList;
  }, [activeId, items, collapsedGroups]);

  let projected;
  // don't calculate projection if the user is not licensed
  if (isLicensed) {
    projected =
      activeId && overId ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth) : null;
  } else {
    projected = { depth: 0, maxDepth: 0, minDepth: 0, pageGroupId: null };
  }

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
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );

  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems]);
  const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null;

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft,
    };
  }, [flattenedItems, offsetLeft]);

  useEffect(() => {
    const treebuilt = buildTree(defaultItems);
    setItems(treebuilt);
  }, [defaultItems]);

  const { enableReleasedVersionPopupState, isVersionReleased } = useAppVersionStore(
    (state) => ({
      enableReleasedVersionPopupState: state.actions.enableReleasedVersionPopupState,
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );

  console.log({
    items,
  });

  return null;

  function handleDragStart(e) {
    const {
      active: { id: activeId },
    } = e;
    setActiveId(activeId);
    setOverId(activeId);

    document.body.style.setProperty('cursor', 'grabbing');
  }

  function handleDragMove({ delta, sensorEvent }) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }) {
    setOverId(over?.id ?? null);
  }

  function handleDragEnd({ active, over }) {
    resetState();
    if (isVersionReleased) {
      enableReleasedVersionPopupState();
      return;
    }
    if (projected && over) {
      const { depth, pageGroupId } = projected;
      const clonedItems = JSON.parse(JSON.stringify(flattenTree(items)));
      let parentItem = null;
      let overIndex = -1;
      let activeIndex = -1;
      clonedItems.forEach((item, index) => {
        if (item.id === pageGroupId) {
          parentItem = item;
        }
        if (item.id === over.id) {
          overIndex = index;
        }
        if (item.id === active.id) {
          activeIndex = index;
        }
      });
      const activeTreeItem = clonedItems[activeIndex];

      clonedItems[activeIndex] = {
        ...activeTreeItem,
        depth,
        pageGroupId,
        ...(depth === 0 && parentItem && !parentItem.isPageGroup
          ? {
              depth: 0,
              pageGroupId: null,
            }
          : {}),
      };

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
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

    document.body.style.setProperty('cursor', '');
  }

  function handleCollapse(id) {
    setCollapsedGroups((groups) => (groups.includes(id) ? groups.filter((group) => group !== id) : [...groups, id]));
  }
}

const adjustTranslate = ({ transform }) => {
  return {
    ...transform,
    y: transform.y - 10,
    x: transform.x + 15,
  };
};
