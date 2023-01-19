import React, { useEffect } from 'react';
import '@/_styles/widgets/kanban.scss';

export const Item = React.memo(
  React.forwardRef(
    (
      {
        dragOverlay,
        dragging,
        disabled,
        fadeIn,
        handle,
        index,
        listeners,
        renderItem,
        sorting,
        style,
        transition,
        transform,
        value,
        wrapperStyle,
        ...props
      },
      ref
    ) => {
      useEffect(() => {
        if (!dragOverlay) {
          return;
        }

        document.body.style.cursor = 'grabbing';

        return () => {
          document.body.style.cursor = '';
        };
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
          className="kanban-item-wrapper"
          style={{
            ...wrapperStyle,
            transition: [transition, wrapperStyle?.transition].filter(Boolean).join(', '),
            '--translate-x': transform ? `${Math.round(transform.x)}px` : undefined,
            '--translate-y': transform ? `${Math.round(transform.y)}px` : undefined,
            '--scale-x': transform?.scaleX ? `${transform.scaleX}` : undefined,
            '--scale-y': transform?.scaleY ? `${transform.scaleY}` : undefined,
            '--index': index,
            backgroundColor: '#fff',
            opacity: dragging ? 0.5 : undefined,
          }}
          ref={ref}
        >
          <div
            className="kanban-item"
            style={style}
            {...(!handle ? listeners : undefined)}
            {...props}
            tabIndex={!handle ? 0 : undefined}
          >
            {value}
          </div>
        </li>
      );
    }
  )
);
