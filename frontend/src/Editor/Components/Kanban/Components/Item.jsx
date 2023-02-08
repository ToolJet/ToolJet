import React, { useEffect } from 'react';
import '@/_styles/widgets/kanban.scss';
import cx from 'classnames';

import { Handle } from './Handle';
import { SubContainer } from '@/Editor/SubContainer';

export const Item = React.memo(
  React.forwardRef(
    (
      {
        dragOverlay,
        dragging,
        disabled,
        fadeIn,
        handle,
        handleProps,
        index,
        listeners,
        renderItem,
        sorting,
        style,
        transition,
        transform,
        value,
        wrapperStyle,
        cardWidth,
        cardHeight,
        kanbanProps,
        parentRef = null,
        isDragActive = false,
        isFirstItem = false,
        setShowModal = () => {},
        cardDataAsObj = {},
        ...props
      },
      ref
    ) => {
      const { id, component, containerProps, fireEvent, setExposedVariable } = kanbanProps;
      useEffect(() => {
        if (!dragOverlay) {
          return;
        }
        document.body.style.cursor = 'grabbing';
        return () => (document.body.style.cursor = '');
      }, [dragOverlay]);

      return renderItem ? (
        renderItem({
          dragOverlay,
          dragging,
          sorting,
          index,
          fadeIn,
          listeners,
          ref,
          style,
          transform,
          transition,
          value,
        })
      ) : (
        <li
          className={cx('kanban-item', fadeIn && 'fadeIn', sorting && 'sorting', dragOverlay && 'dragOverlay')}
          style={{
            ...wrapperStyle,
            transition: [transition, wrapperStyle?.transition].filter(Boolean).join(', '),
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
            setExposedVariable('lastSelectedCard', cardDataAsObj[value]).then(() => {
              setShowModal(true);
              fireEvent('onCardSelected');
            });
          }}
        >
          <div
            className={cx(
              'item',
              dragging && 'dragging',
              handle && 'withHandle',
              dragOverlay && 'dragOverlay',
              disabled && 'disabled'
            )}
            style={style}
            {...(!handle ? listeners : undefined)}
            {...props}
            tabIndex={!handle ? 0 : undefined}
          >
            <div className="subcontainer-container" onMouseDown={(e) => e.stopPropagation()}>
              <SubContainer
                parentComponent={component}
                containerCanvasWidth={308}
                parent={`${id}`}
                parentName={component.name}
                customResolvables={{ cardData: cardDataAsObj[value] }}
                {...containerProps}
                readOnly={isDragActive || !isFirstItem}
                parentRef={parentRef}
              />
            </div>
            <span className="handle-container">{handle ? <Handle {...handleProps} {...listeners} /> : null}</span>
          </div>
        </li>
      );
    }
  )
);
