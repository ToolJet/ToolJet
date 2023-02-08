import React, { forwardRef } from 'react';
import '@/_styles/widgets/kanban.scss';
import cx from 'classnames';

import { Handle } from './Handle';

export const Container = forwardRef(
  (
    { children, columns = 1, handleProps, horizontal, hover, label, style, scrollable, shadow, unstyled, ...props },
    ref
  ) => {
    const { kanbanProps } = props;
    const {
      styles: { accentColor },
    } = kanbanProps;

    const hexaCodeToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},0.2)`;
    };

    const colAccentColor = {
      color: accentColor ?? '#4d72fa',
      backgroundColor: accentColor ? hexaCodeToRgb(accentColor) : hexaCodeToRgb('#4d72fa'),
    };

    return (
      <div
        {...props}
        ref={ref}
        style={{
          ...style,
          '--columns': columns,
        }}
        className={cx(
          'kanban-container',
          unstyled && 'unstyled',
          horizontal && 'horizontal',
          hover && 'hover',
          scrollable && 'scrollable',
          shadow && 'shadow'
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {label ? (
          <div className="header">
            <span style={colAccentColor} className="container-name">
              {label}
            </span>
            <div className="actions invisible">
              <Handle {...handleProps} />
            </div>
          </div>
        ) : null}
        <ul>{children}</ul>
      </div>
    );
  }
);
