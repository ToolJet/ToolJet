import React, { useEffect, forwardRef } from 'react';
import '@/_styles/widgets/kanban.scss';
import cx from 'classnames';
import { Handle } from './Handle';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { cardStyleVars } from '../helpers/styleVars';

const isResizeTarget = (target) =>
  target.style.cursor.includes('resize') ||
  target?.classList?.contains('delete-icon') ||
  target?.parent?.classList?.contains('resizer-active');

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
        selected = false,
        cardData,
        dataCy,
        ...props
      },
      ref
    ) => {
      const { id, component, containerProps, fireEvent, darkMode, setExposedVariable } = kanbanProps;
      const shadcn = kanbanProps.properties?.skin === 'shadcn';
      useEffect(() => {
        if (!dragOverlay) {
          return;
        }
        document.body.style.cursor = 'grabbing';
        return () => (document.body.style.cursor = '');
      }, [dragOverlay]);

      return (
        <li
          className={cx('kanban-item', sorting && 'sorting', dragOverlay && 'dragOverlay', shadcn && 'skin-shadcn')}
          style={{
            transition: [transition].filter(Boolean).join(', '),
            '--translate-x': transform ? `${Math.round(transform.x)}px` : undefined,
            '--translate-y': transform ? `${Math.round(transform.y)}px` : undefined,
            '--scale-x': transform?.scaleX ? `${transform.scaleX}` : undefined,
            '--scale-y': transform?.scaleY ? `${transform.scaleY}` : undefined,
            '--index': index,
            ...cardStyleVars(kanbanProps.styles),
            width: `${Number(cardWidth) || 300}px`,
            height: `${Number(cardHeight) || 100}px`,
          }}
          ref={ref}
          data-cy={dataCy ? `${dataCy}-card-${value}` : undefined}
          onClick={({ target }) => {
            const { properties } = kanbanProps;
            const { openModalOnCardClick } = properties;
            if (!openModalOnCardClick || isResizeTarget(target)) return;
            if (shadcn) {
              setShowModal(true);
              return;
            }
            setExposedVariable('lastSelectedCard', cardDataAsObj[value]);
            setLastSelectedCard(cardDataAsObj[value]);
            setShowModal(true);
            fireEvent('onCardSelected');
          }}
          // The shadcn/ui style selects a card on any click inside it, modal or not: the card's child canvas stops a
          // click on its empty space from bubbling, and a button in the card can then act on this card.
          onClickCapture={
            shadcn
              ? ({ target }) => {
                  if (isResizeTarget(target)) return;
                  setExposedVariable('lastSelectedCard', cardDataAsObj[value]);
                  setLastSelectedCard(cardDataAsObj[value]);
                  fireEvent('onCardSelected');
                }
              : undefined
          }
        >
          <div
            className={cx(
              'item',
              'withHandle',
              dragging && 'dragging',
              dragOverlay && 'dragOverlay',
              disabled && 'disabled',
              darkMode && 'dark-light',
              selected && 'selected'
            )}
            {...props}
          >
            <div className="subcontainer-container" onMouseDown={(e) => e.stopPropagation()}>
              <SubContainer
                canvasWidth={Number(cardWidth) || 300}
                canvasHeight={Number(cardHeight) || 100}
                id={id}
                index={cardData.findIndex((card) => card.id === value)}
                styles={{
                  // The card template fills the card, so it carries the card background.
                  backgroundColor: shadcn
                    ? 'var(--kb-card-bg, var(--cc-surface1-surface))'
                    : 'var(--kb-card-bg, var(--base))',
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
