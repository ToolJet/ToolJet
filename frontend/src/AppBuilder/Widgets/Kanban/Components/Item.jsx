import React, { useEffect, forwardRef } from 'react';
import '@/_styles/widgets/kanban.scss';
import cx from 'classnames';
import { Handle } from './Handle';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';

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
          onClick={({ target }) => {
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
                index={cardData.findIndex((card) => card.id === value)}
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
