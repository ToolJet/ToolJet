import React, { useEffect, forwardRef } from 'react';
import '@/_styles/widgets/kanban.scss';
import cx from 'classnames';
import { Handle } from './Handle';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';

// Position of each card id in a card list, built once per list: every card searching the whole list for itself was
// cards × cards work on every render.
const cardIndexes = new WeakMap();
const indexOfCard = (cards, id) => {
  if (!Array.isArray(cards)) return -1;
  let indexes = cardIndexes.get(cards);
  if (!indexes) {
    indexes = new Map();
    cards.forEach((card, index) => {
      if (!indexes.has(card?.id)) indexes.set(card?.id, index);
    });
    cardIndexes.set(cards, indexes);
  }
  return indexes.has(id) ? indexes.get(id) : -1;
};

export const Item = React.memo(
  forwardRef(
    (
      {
        dragOverlay,
        dragging,
        disabled,
        handleProps,
        index,
        listeners,
        sorting,
        transition,
        transform,
        value,
        cardWidth,
        cardHeight,
        kanbanProps,
        parentRef = null,
        isDragActive = false,
        isFirstItem = false,
        setShowModal = () => {},
        cardDataAsObj = {},
        setLastSelectedCard,
        cardData,
        dataCy,
        ...props
      },
      ref
    ) => {
      const { id, component, containerProps, fireEvent, darkMode, setExposedVariable } = kanbanProps;
      useEffect(() => {
        if (!dragOverlay) {
          return;
        }
        document.body.style.cursor = 'grabbing';
        return () => (document.body.style.cursor = '');
      }, [dragOverlay]);

      return (
        <li
          className={cx('kanban-item', sorting && 'sorting', dragOverlay && 'dragOverlay')}
          style={{
            transition: [transition].filter(Boolean).join(', '),
            '--translate-x': transform ? `${Math.round(transform.x)}px` : undefined,
            '--translate-y': transform ? `${Math.round(transform.y)}px` : undefined,
            '--scale-x': transform?.scaleX ? `${transform.scaleX}` : undefined,
            '--scale-y': transform?.scaleY ? `${transform.scaleY}` : undefined,
            '--index': index,
            width: `${Number(cardWidth) || 300}px`,
            height: `${Number(cardHeight) || 100}px`,
          }}
          ref={ref}
          data-cy={dataCy ? `${dataCy}-card-${value}` : undefined}
          onClick={({ target }) => {
            const { properties } = kanbanProps;
            const { openModalOnCardClick } = properties;
            if (!openModalOnCardClick) return;
            if (
              target.style.cursor.includes('resize') ||
              target?.classList?.contains('delete-icon') ||
              target?.parent?.classList?.contains('resizer-active')
            )
              return;
            setExposedVariable('lastSelectedCard', cardDataAsObj[value]);
            setLastSelectedCard(cardDataAsObj[value]);
            setShowModal(true);
            fireEvent('onCardSelected');
          }}
        >
          <div
            className={cx(
              'item',
              'withHandle',
              dragging && 'dragging',
              dragOverlay && 'dragOverlay',
              disabled && 'disabled',
              darkMode && 'dark-light'
            )}
            {...props}
          >
            <div className="subcontainer-container" onMouseDown={(e) => e.stopPropagation()}>
              <SubContainer
                canvasWidth={Number(cardWidth) || 300}
                canvasHeight={Number(cardHeight) || 100}
                id={id}
                index={indexOfCard(cardData, value)}
                styles={{
                  backgroundColor: 'var(--base)',
                }}
                darkMode={darkMode}
                componentType="Kanban"
              />
            </div>
            <span className="handle-container">
              <Handle {...handleProps} {...listeners} />
            </span>
          </div>
        </li>
      );
    }
  )
);
