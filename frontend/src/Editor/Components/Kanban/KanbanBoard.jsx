import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  DndContext,
  DragOverlay,
  getFirstCollision,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensors,
  useSensor,
  MeasuringStrategy,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { coordinateGetter as multipleContainersCoordinateGetter } from './helpers/multipleContainersKeyboardCoordinates';

import { Item } from './Components/Item';
import { Container } from './Components/Container';
import { useMounted } from '@/_hooks/use-mount';
import { Modal } from './Components/Modal';
import { getColumnData, getCardData, getData, animateLayoutChanges, isArray } from './helpers/utils';
import { toast } from 'react-hot-toast';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import cx from 'classnames';

function DroppableContainer({ children, columns = 1, disabled, id, items, style, ...props }) {
  const { active, attributes, isDragging, listeners, over, setNodeRef, transition, transform } = useSortable({
    id,
    data: {
      type: 'container',
      children: items,
    },
    animateLayoutChanges,
  });
  const isOverContainer = over
    ? (id === over.id && active?.data.current?.type !== 'container') || items?.includes(over.id)
    : false;

  return (
    <Container
      ref={disabled ? undefined : setNodeRef}
      style={{
        ...style,
        transition,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : undefined,
      }}
      hover={isOverContainer}
      handleProps={{
        ...attributes,
        ...listeners,
      }}
      columns={columns}
      {...props}
    >
      {children}
    </Container>
  );
}

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const TRASH_ID = 'void';

export function KanbanBoard({
  adjustScale = false,
  cancelDrop,
  columns,
  handle = false,
  containerStyle,
  coordinateGetter = multipleContainersCoordinateGetter,
  getItemStyles = () => ({}),
  wrapperStyle = () => ({}),
  minimal = false,
  modifiers,
  renderItem,
  strategy = verticalListSortingStrategy,
  vertical = false,
  scrollable,
  kanbanProps,
  parentRef,
}) {
  const { properties, fireEvent, setExposedVariable, setExposedVariables, registerAction, exposedVariables, styles } =
    kanbanProps;
  const { lastSelectedCard = {} } = exposedVariables;
  const { columnData, cardData, cardWidth, cardHeight, showDeleteButton, enableAddCard } = properties;
  const { accentColor } = styles;

  const convertArrayToObj = (data = []) => {
    const containers = {};
    if (isArray(data)) {
      data.forEach((d) => {
        containers[d.id] = d;
      });
    }

    return containers;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columnDataAsObj = useMemo(() => convertArrayToObj(columnData), [JSON.stringify(columnData)]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cardDataAsObj = useMemo(() => convertArrayToObj(cardData), [JSON.stringify(cardData)]);

  const [items, setItems] = useState({});
  const [containers, setContainers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const lastOverId = useRef(null);
  const cardMovementRef = useRef(null);
  const shouldUpdateData = useRef(false);
  const recentlyMovedToNewContainer = useRef(false);
  const isSortingContainer = activeId ? containers.includes(activeId) : false;

  const colAccentColor = {
    color: '#fff',
    backgroundColor: accentColor ?? '#4d72fa',
  };

  useEffect(() => {
    setContainers(() => getColumnData(columnData));
    shouldUpdateData.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(columnData)]);

  useEffect(() => {
    setItems(() => getCardData(cardData, { ...columnDataAsObj }));
    shouldUpdateData.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cardData), JSON.stringify(columnDataAsObj)]);

  useEffect(() => {
    if (shouldUpdateData.current) {
      shouldUpdateData.current = false;
      setExposedVariable('updatedCardData', getData(cardDataAsObj)).then(() => {
        fireEvent('onUpdate');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUpdateData.current, JSON.stringify(cardDataAsObj)]);

  registerAction(
    'updateCardData',
    async function (cardId, value) {
      if (cardDataAsObj[cardId] === undefined) return toast.error('Card not found');
      const cardToBeUpdated = { ...cardDataAsObj[cardId] };
      cardDataAsObj[cardId] = value;
      const diffKeys = Object.keys(diff(cardToBeUpdated, value));
      if (lastSelectedCard?.id === cardId) {
        return setExposedVariables({
          lastSelectedCard: cardDataAsObj[cardId],
          lastUpdatedCard: cardDataAsObj[cardId],
          lastCardUpdate: diffKeys.map((key) => {
            return {
              [key]: { oldValue: cardToBeUpdated[key], newValue: value[key] },
            };
          }),
          updatedCardData: getData(cardDataAsObj),
        }).then(() => {
          fireEvent('onUpdate');
        });
      }
      setExposedVariable('updatedCardData', getData(cardDataAsObj)).then(() => {
        fireEvent('onUpdate');
      });
    },
    [lastSelectedCard, JSON.stringify(cardDataAsObj)]
  );

  registerAction(
    'moveCard',
    async function (cardId, columnId) {
      if (cardDataAsObj[cardId] === undefined) return toast.error('Card not found');
      if (cardDataAsObj[cardId]['columnId'] === columnId) return;
      const cardToBeMoved = { ...cardDataAsObj[cardId] };
      const originColumnId = cardToBeMoved['columnId'];
      const activeIndex = items[cardToBeMoved['columnId']].indexOf(cardId);
      setItems((items) => ({
        ...items,
        [originColumnId]: items[originColumnId].filter((id) => id !== cardId),
        [columnId]: [cardId, ...items[columnId]],
      }));
      cardDataAsObj[cardId] = { ...cardDataAsObj[cardId], columnId: columnId };
      const lastCardMovement = {
        originContainerId: cardToBeMoved.columnId,
        destinationContainerId: columnId,
        originCardIndex: activeIndex,
        destinationIndex: 0,
        cardDetails: { ...cardDataAsObj[cardId] },
      };
      setExposedVariable('lastCardMovement', lastCardMovement).then(() => fireEvent('onCardMoved'));
    },
    [items, JSON.stringify(cardDataAsObj)]
  );

  registerAction(
    'addCard',
    async function (cardDetails) {
      if (cardDataAsObj[cardDetails.id]) return toast.error('Card already exists');
      if (cardDetails?.columnId === undefined || items[cardDetails?.columnId] === undefined)
        return toast.error('Column Id not found');
      const columnId = cardDetails.columnId;
      cardDataAsObj[cardDetails.id] = cardDetails;
      setItems((items) => ({
        ...items,
        [columnId]: [...items[columnId], cardDetails.id],
      }));

      setExposedVariables({ lastAddedCard: { ...cardDetails }, updatedCardData: getData(cardDataAsObj) }).then(() => {
        fireEvent('onCardAdded');
        fireEvent('onUpdate');
      });
    },
    [items, JSON.stringify(cardDataAsObj)]
  );

  registerAction(
    'deleteCard',
    async function (cardId) {
      if (cardDataAsObj[cardId] === undefined) return toast.error('Card not found');
      const columnId = cardDataAsObj[cardId]['columnId'];
      const deletedCard = cardDataAsObj[cardId];
      delete cardDataAsObj[cardId];
      showModal && setShowModal(false);
      setItems((items) => ({
        ...items,
        [columnId]: items[columnId].filter((id) => id !== cardId),
      }));
      setExposedVariables({ lastRemovedCard: { ...deletedCard }, updatedCardData: getData(cardDataAsObj) }).then(() => {
        fireEvent('onCardRemoved');
        fireEvent('onUpdate');
      });
    },
    [showModal, JSON.stringify(cardDataAsObj)]
  );

  /**
   * Custom collision detection strategy optimized for multiple containers
   *
   * - First, find any droppable containers intersecting with the pointer.
   * - If there are none, find intersecting containers with the active draggable.
   * - If there are no intersecting containers, return the last matched intersection
   *
   */
  const collisionDetectionStrategy = useCallback(
    (args) => {
      if (activeId && activeId in items) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) => container.id in items),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');

      if (overId != null) {
        if (overId === TRASH_ID) {
          // If the intersecting droppable is the trash, return early
          // Remove this if you're not using trashable functionality in your app
          return intersections;
        }

        if (overId in items) {
          const containerItems = items[overId];

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) => container.id !== overId && containerItems.includes(container.id)
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;

        return [{ id: overId }];
      }

      // When a draggable item moves to a new container, the layout may shift
      // and the `overId` may become `null`. We manually set the cached `lastOverId`
      // to the id of the draggable item that was moved to the new container, otherwise
      // the previous `overId` will be returned which can cause items to incorrectly shift positions
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, items]
  );
  const [clonedItems, setClonedItems] = useState(null);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );
  const findContainer = (id) => {
    if (id in items) {
      return id;
    }
    return Object.keys(items).find((key) => items[key].includes(id));
  };

  const getIndex = (id) => {
    const container = findContainer(id);
    if (!container) {
      return -1;
    }
    return items[container].indexOf(id);
  };

  const onDragCancel = () => {
    if (clonedItems) {
      setItems(clonedItems);
    }
    setActiveId(null);
    setClonedItems(null);
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  const onDragStart = ({ active }) => {
    const activeContainer = findContainer(active.id);
    cardMovementRef.current = {
      originContainerId: activeContainer,
    };
    setActiveId(active.id);
    setClonedItems(items);
  };

  const onDragOver = ({ active, over }) => {
    const overId = over?.id;

    if (overId == null || overId === TRASH_ID || active.id in items) {
      return;
    }

    const overContainer = findContainer(overId);
    const activeContainer = findContainer(active.id);

    if (!overContainer || !activeContainer) {
      return;
    }

    if (activeContainer !== overContainer) {
      setItems((items) => {
        const activeItems = items[activeContainer];
        const overItems = items[overContainer];
        const overIndex = overItems.indexOf(overId);
        const activeIndex = activeItems.indexOf(active.id);

        let newIndex;

        if (overId in items) {
          newIndex = overItems.length + 1;
        } else {
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top > over.rect.top + over.rect.height;

          const modifier = isBelowOverItem ? 1 : 0;

          newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
        }

        recentlyMovedToNewContainer.current = true;

        cardDataAsObj[active.id] = { ...cardDataAsObj[active.id], columnId: overContainer };
        const lastCardMovement = {
          destinationContainerId: overContainer,
          originCardIndex: activeIndex,
          destinationIndex: overIndex,
          cardDetails: { ...cardDataAsObj[active.id] },
        };
        cardMovementRef.current = { ...cardMovementRef.current, ...lastCardMovement };

        return {
          ...items,
          [activeContainer]: items[activeContainer].filter((item) => item !== active.id),
          [overContainer]: [
            ...items[overContainer].slice(0, newIndex),
            items[activeContainer][activeIndex],
            ...items[overContainer].slice(newIndex, items[overContainer].length),
          ],
        };
      });
    }
  };

  const onDragEnd = ({ active, over }) => {
    if (active.id in items && over?.id) {
      setContainers((containers) => {
        const activeIndex = containers.indexOf(active.id);
        const overIndex = containers.indexOf(over.id);

        return arrayMove(containers, activeIndex, overIndex);
      });
    }

    const activeContainer = findContainer(active.id);

    if (!activeContainer) {
      setActiveId(null);
      return;
    }

    const overId = over?.id;

    if (overId == null) {
      setActiveId(null);
      return;
    }

    if (overId === TRASH_ID) {
      shouldUpdateData.current = true;
      const deletedCard = cardDataAsObj[activeId];
      delete cardDataAsObj[activeId];
      setItems((items) => ({
        ...items,
        [activeContainer]: items[activeContainer].filter((id) => id !== activeId),
      }));
      setExposedVariable('lastRemovedCard', { ...deletedCard }).then(() => {
        fireEvent('onCardRemoved');
      });
      setActiveId(null);
      return;
    }

    const overContainer = findContainer(overId);

    if (overContainer) {
      const activeIndex = items[activeContainer].indexOf(active.id);
      const overIndex = items[overContainer].indexOf(overId);

      if (activeIndex !== overIndex) {
        shouldUpdateData.current = true;
        setItems((items) => ({
          ...items,
          [overContainer]: arrayMove(items[overContainer], activeIndex, overIndex),
        }));
        cardDataAsObj[active.id] = { ...cardDataAsObj[active.id], columnId: overContainer };
        const lastCardMovement = {
          originContainerId: cardMovementRef.current.originContainerId,
          destinationContainerId: overContainer,
          originCardIndex: activeIndex,
          destinationIndex: overIndex,
          cardDetails: { ...cardDataAsObj[active.id] },
        };
        setExposedVariable('lastCardMovement', lastCardMovement).then(() => fireEvent('onCardMoved'));
      } else if (cardMovementRef.current !== null) {
        const { cardDetails, destinationContainerId } = cardMovementRef.current;
        if (cardDetails?.id === over?.id && destinationContainerId === overContainer) {
          shouldUpdateData.current = true;
          setExposedVariable('lastCardMovement', { ...cardMovementRef.current }).then(() => {
            cardMovementRef.current = null;
            fireEvent('onCardMoved');
          });
        }
      }
    }

    setActiveId(null);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        cancelDrop={cancelDrop}
        onDragCancel={onDragCancel}
        modifiers={modifiers}
      >
        <div
          style={{
            display: 'inline-grid',
            boxSizing: 'border-box',
            gridAutoFlow: vertical ? 'row' : 'column',
          }}
        >
          <SortableContext
            items={containers}
            strategy={vertical ? verticalListSortingStrategy : horizontalListSortingStrategy}
          >
            {containers.map((columnId) => {
              return (
                <DroppableContainer
                  key={columnId}
                  id={columnId}
                  label={columnDataAsObj[columnId]?.title ?? ''}
                  columns={columns}
                  items={items[columnId] ?? []}
                  scrollable={scrollable}
                  style={containerStyle}
                  unstyled={minimal}
                  kanbanProps={kanbanProps}
                >
                  {items[columnId] && (
                    <SortableContext items={items[columnId]} strategy={strategy}>
                      {items[columnId].map((value, index) => {
                        return (
                          <SortableItem
                            disabled={isSortingContainer}
                            key={value}
                            id={value}
                            index={index}
                            handle={handle}
                            style={getItemStyles}
                            wrapperStyle={wrapperStyle}
                            renderItem={renderItem}
                            columnId={columnId}
                            getIndex={getIndex}
                            cardWidth={cardWidth}
                            cardHeight={cardHeight}
                            kanbanProps={kanbanProps}
                            parentRef={parentRef}
                            isDragActive={activeId !== null}
                            isFirstItem={index === 0 && containers[0] === columnId}
                            setShowModal={setShowModal}
                            cardDataAsObj={cardDataAsObj}
                          />
                        );
                      })}
                    </SortableContext>
                  )}
                </DroppableContainer>
              );
            })}
          </SortableContext>
          <button
            className={cx('kanban-add-card-button jet-button btn', !enableAddCard && 'invisible')}
            style={colAccentColor}
            onClick={() => enableAddCard && fireEvent('onAddCardClick')}
          >
            + Add Card
          </button>
        </div>
        {createPortal(
          <DragOverlay adjustScale={adjustScale} dropAnimation={dropAnimation}>
            {activeId
              ? containers.includes(activeId)
                ? renderContainerDragOverlay(activeId)
                : renderSortableItemDragOverlay(activeId)
              : null}
          </DragOverlay>,
          document.body
        )}
        {showDeleteButton ? <Trash id={TRASH_ID} /> : null}
      </DndContext>
      <Modal showModal={showModal} kanbanProps={kanbanProps} setShowModal={setShowModal} />
    </>
  );

  function renderSortableItemDragOverlay(id) {
    return (
      <Item
        value={id}
        handle={handle}
        style={getItemStyles({
          columnId: findContainer(id),
          overIndex: -1,
          index: getIndex(id),
          value: id,
          isSorting: true,
          isDragging: true,
          isDragOverlay: true,
        })}
        wrapperStyle={wrapperStyle({ index: 0 })}
        renderItem={renderItem}
        dragOverlay
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        kanbanProps={kanbanProps}
        parentRef={parentRef}
        isDragActive={true}
        cardDataAsObj={cardDataAsObj}
      />
    );
  }

  function renderContainerDragOverlay(columnId) {
    return (
      <Container
        label={columnDataAsObj[columnId]?.title ?? ''}
        columns={columns}
        style={{
          height: '100%',
        }}
        shadow
        unstyled={false}
        kanbanProps={kanbanProps}
      >
        {items[columnId].map((item, index) => (
          <Item
            key={item}
            value={item}
            handle={handle}
            style={getItemStyles({
              columnId,
              overIndex: -1,
              index: getIndex(item),
              value: item,
              isDragging: false,
              isSorting: false,
              isDragOverlay: false,
            })}
            wrapperStyle={wrapperStyle({ index })}
            renderItem={renderItem}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            kanbanProps={kanbanProps}
            parentRef={parentRef}
            cardDataAsObj={cardDataAsObj}
          />
        ))}
      </Container>
    );
  }
}

function Trash({ id }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        left: '50%',
        marginLeft: -150,
        bottom: 20,
        width: 300,
        height: 60,
        borderRadius: 5,
        border: '1px solid',
        borderColor: isOver ? 'red' : '#DDD',
      }}
    >
      Drop here to delete
    </div>
  );
}

function SortableItem({
  disabled,
  id,
  index,
  handle,
  renderItem,
  style,
  columnId,
  getIndex,
  wrapperStyle,
  cardWidth,
  cardHeight,
  kanbanProps,
  parentRef,
  isDragActive,
  isFirstItem,
  setShowModal,
  cardDataAsObj,
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, isDragging, isSorting, over, overIndex, transform, transition } =
    useSortable({
      id,
    });
  const isMounted = useMounted();
  const mountedWhileDragging = isDragging && !isMounted;

  return (
    <Item
      ref={disabled ? undefined : setNodeRef}
      value={id}
      dragging={isDragging}
      sorting={isSorting}
      handle={handle}
      handleProps={handle ? setActivatorNodeRef : undefined}
      index={index}
      wrapperStyle={wrapperStyle({ index })}
      style={style({
        index,
        value: id,
        isDragging,
        isSorting,
        overIndex: over ? getIndex(over.id) : overIndex,
        columnId,
      })}
      transition={transition}
      transform={transform}
      fadeIn={mountedWhileDragging}
      listeners={listeners}
      renderItem={renderItem}
      cardWidth={cardWidth}
      cardHeight={cardHeight}
      kanbanProps={kanbanProps}
      parentRef={parentRef}
      isDragActive={isDragActive}
      isFirstItem={isFirstItem}
      setShowModal={setShowModal}
      cardDataAsObj={cardDataAsObj}
    />
  );
}
