import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensors,
  useSensor,
  rectIntersection,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { coordinateGetter } from './helpers/multipleContainersKeyboardCoordinates';

import { Item } from './Components/Item';
import { Container } from './Components/Container';
import { Trash } from './Components/Trash';
import { Modal } from './Components/Modal';
import { getColumnData, getCardData, getData, convertArrayToObj, findContainer } from './helpers/utils';
import { toast } from 'react-hot-toast';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import cx from 'classnames';

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

export function KanbanBoard({ widgetHeight, kanbanProps, parentRef }) {
  const { properties, fireEvent, setExposedVariable, setExposedVariables, registerAction, exposedVariables, styles } =
    kanbanProps;
  const { lastSelectedCard = {} } = exposedVariables;
  const { columnData, cardData, cardWidth, cardHeight, showDeleteButton, enableAddCard } = properties;
  const { accentColor } = styles;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columnDataAsObj = useMemo(() => convertArrayToObj(columnData), [JSON.stringify(columnData)]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cardDataAsObj = useMemo(() => convertArrayToObj(cardData), [JSON.stringify(cardData)]);

  const [items, setItems] = useState({});
  const [containers, setContainers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const cardMovementRef = useRef(null);
  const shouldUpdateData = useRef(false);
  const droppableItemsColumnId = useRef(0);

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
        // fireEvent('onUpdate');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUpdateData.current, JSON.stringify(cardDataAsObj)]);

  useEffect(() => {
    droppableItemsColumnId.current = containers.find((container) => items[container]?.length > 0);
  }, [items, containers]);

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
        originColumnId: cardToBeMoved.columnId,
        destinationColumnId: columnId,
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

      setExposedVariables({
        lastAddedCard: { ...cardDetails },
        updatedCardData: getData(cardDataAsObj),
      }).then(() => {
        fireEvent('onCardAdded');
        // fireEvent('onUpdate');
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
      setExposedVariables({
        lastRemovedCard: { ...deletedCard },
        updatedCardData: getData(cardDataAsObj),
      }).then(() => {
        fireEvent('onCardRemoved');
        // fireEvent('onUpdate');
      });
    },
    [showModal, JSON.stringify(cardDataAsObj)]
  );

  const [clonedItems, setClonedItems] = useState(null);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );

  const onDragCancel = () => {
    if (clonedItems) {
      setItems(clonedItems);
    }
    setActiveId(null);
    setClonedItems(null);
  };

  const onDragStart = ({ active }) => {
    const activeContainer = findContainer(items, active.id);
    cardMovementRef.current = {
      originColumnId: activeContainer,
    };
    setActiveId(active.id);
    setClonedItems(items);
  };

  const onDragOver = ({ active, over }) => {
    const overId = over?.id;
    const activeIdInString = String(active.id);

    if (overId == null || overId === TRASH_ID || activeIdInString.includes('tj-kanban-container-')) {
      return;
    }

    const overContainer = findContainer(items, overId);
    const activeContainer = findContainer(items, active.id);

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

        cardDataAsObj[active.id] = { ...cardDataAsObj[active.id], columnId: overContainer };
        const lastCardMovement = {
          destinationColumnId: overContainer,
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
    const activeContainer = findContainer(items, active.id);

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

    const overContainer = findContainer(items, overId);

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
          originColumnId: cardMovementRef.current.originColumnId,
          destinationColumnId: overContainer,
          originCardIndex: activeIndex,
          destinationIndex: overIndex,
          cardDetails: { ...cardDataAsObj[active.id] },
        };
        setExposedVariable('lastCardMovement', lastCardMovement).then(() => fireEvent('onCardMoved'));
      } else if (cardMovementRef.current !== null) {
        const { cardDetails, destinationColumnId } = cardMovementRef.current;
        if (cardDetails?.id === over?.id && destinationColumnId === overContainer) {
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
        collisionDetection={rectIntersection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div
          style={{
            display: 'inline-grid',
            boxSizing: 'border-box',
            gridAutoFlow: 'column',
          }}
        >
          {containers.map((columnId) => {
            return (
              <Container
                key={columnId}
                id={`tj-kanban-container-${columnId}`}
                label={columnDataAsObj[columnId]?.title ?? ''}
                items={items[columnId] ?? []}
                style={{
                  maxHeight: widgetHeight - 30,
                  width: `${(Number(cardWidth) || 300) + 48}px`,
                }}
                kanbanProps={kanbanProps}
              >
                {items[columnId] && (
                  <SortableContext
                    items={items[columnId]}
                    strategy={verticalListSortingStrategy}
                  >
                    {items[columnId].map((value, index) => {
                      return (
                        <SortableItem
                          disabled={false}
                          key={value}
                          id={value}
                          index={index}
                          columnId={columnId}
                          cardWidth={cardWidth}
                          cardHeight={cardHeight}
                          kanbanProps={kanbanProps}
                          parentRef={parentRef}
                          isDragActive={activeId !== null}
                          isFirstItem={index === 0 && droppableItemsColumnId.current === columnId}
                          setShowModal={setShowModal}
                          cardDataAsObj={cardDataAsObj}
                        />
                      );
                    })}
                  </SortableContext>
                )}
              </Container>
            );
          })}
          <button
            className={cx('kanban-add-card-button jet-button btn', !enableAddCard && 'invisible')}
            style={colAccentColor}
            onClick={() => enableAddCard && fireEvent('onAddCardClick')}
          >
            + Add Card
          </button>
        </div>
        {createPortal(
          <DragOverlay dropAnimation={dropAnimation}>
            {activeId ? renderSortableItemDragOverlay(activeId) : null}
          </DragOverlay>,
          document.body
        )}
        {showDeleteButton ? <Trash id={TRASH_ID} /> : null}
      </DndContext>
      <Modal
        showModal={showModal}
        kanbanProps={kanbanProps}
        setShowModal={setShowModal}
      />
    </>
  );

  function renderSortableItemDragOverlay(id) {
    return (
      <Item
        value={id}
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
}

function SortableItem({
  disabled,
  id,
  index,
  cardWidth,
  cardHeight,
  kanbanProps,
  parentRef,
  isDragActive,
  isFirstItem,
  setShowModal,
  cardDataAsObj,
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, isDragging, isSorting, transform, transition } = useSortable({
    id,
  });

  return (
    <Item
      ref={disabled ? undefined : setNodeRef}
      value={id}
      dragging={isDragging}
      sorting={isSorting}
      handleProps={setActivatorNodeRef}
      index={index}
      transition={transition}
      transform={transform}
      listeners={listeners}
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
