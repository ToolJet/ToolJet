import React, { forwardRef } from 'react';
import '@/_styles/widgets/kanban.scss';

export const Container = forwardRef(
  (
    {
      children,
      columns = 1,
      horizontal,
      hover,
      onClick,
      label,
      placeholder,
      style,
      scrollable,
      shadow,
      unstyled,
      ...props
    },
    ref
  ) => {
    const Component = onClick ? 'button' : 'div';

    return (
      <Component
        {...props}
        ref={ref}
        style={{
          ...style,
          '--columns': columns,
        }}
        className="kanban-container"
        onClick={onClick}
        tabIndex={onClick ? 0 : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {label ? <div className="header">{label}</div> : null}
        {placeholder ? children : <ul>{children}</ul>}
      </Component>
    );
  }
);
