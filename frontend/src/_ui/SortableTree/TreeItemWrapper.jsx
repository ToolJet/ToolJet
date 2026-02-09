import React, { forwardRef } from 'react';
import classNames from 'classnames';
import styles from './TreeItem.module.css';

export const TreeItemWrapper = forwardRef(
  (
    {
      clone,
      depth,
      disableSelection,
      disableInteraction,
      ghost,
      handleProps,
      indentationWidth,
      indicator,
      collapsed,
      onCollapse,
      style,
      value,
      wrapperRef,
      groupToHighlight,
      darkMode,
      renderItem,
      handlerClassName,
      isNested,
      nestedStyle,
      ...props
    },
    ref
  ) => {
    const shouldHighlight = groupToHighlight === value?.id;
    const nested = isNested !== undefined ? isNested : depth > 0;

    return (
      <li
        {...handleProps}
        data-draggable="true"
        className={classNames(
          styles.Wrapper,
          clone && styles.clone,
          ghost && styles.ghost,
          indicator && styles.indicator,
          disableSelection && styles.disableSelection,
          disableInteraction && styles.disableInteraction,
          groupToHighlight && styles.removeBorder,
          handlerClassName
        )}
        ref={wrapperRef}
        style={{
          '--spacing': `${indentationWidth * depth}px`,
        }}
      >
        <div
          className={styles.TreeItem}
          ref={ref}
          style={{
            ...style,
            width: '100%',
            ...(nested && (nestedStyle || {
              borderLeft: '1px dashed var(--border-weak)',
              padding: '0 0 0 16px',
            })),
          }}
        >
          {renderItem(value, {
            collapsed,
            onCollapse,
            depth,
            isHighlighted: shouldHighlight,
            ghost,
            darkMode,
            ...props,
          })}
        </div>
      </li>
    );
  }
);

TreeItemWrapper.displayName = 'TreeItemWrapper';
