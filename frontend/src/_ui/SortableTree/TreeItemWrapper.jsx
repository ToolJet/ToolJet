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

    // Render guide lines for each ancestor depth level
    const guideLines =
      nested && !nestedStyle && depth > 0
        ? Array.from({ length: depth }, (_, i) => (
            <div
              key={i}
              className={styles.ChildIndentation}
              style={{
                left: `${indentationWidth * i}px`,
              }}
            />
          ))
        : null;

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
          position: guideLines ? 'relative' : undefined,
        }}
      >
        {guideLines}
        <div
          className={styles.TreeItem}
          ref={ref}
          style={{
            ...style,
            width: '100%',
            ...(nested && nestedStyle ? nestedStyle : {}),
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
