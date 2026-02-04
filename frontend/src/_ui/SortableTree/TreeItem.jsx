import React, { forwardRef } from 'react';
import classNames from 'classnames';

import styles from './TreeItem.module.css';

export const TreeItem = forwardRef(
  (
    {
      clone,
      depth,
      disableSelection,
      disableInteraction,
      ghost,
      handleProps,
      indentationWidth = 15,
      indicator,
      collapsed,
      onCollapse,
      style,
      value,
      wrapperRef,
      groupToHighlight,
      darkMode,
      renderItem,
      propertyNames = { isGroup: 'isGroup', parentId: 'parentId' },
      // Pass through additional props to renderItem
      ...restProps
    },
    ref
  ) => {
    const { isGroup: isGroupKey, parentId: parentIdKey } = propertyNames;
    const shouldHighlight = groupToHighlight === value?.id;
    const isNested = depth > 0;
    const isGroup = value?.[isGroupKey];

    // Props to pass to the renderItem function
    const itemRenderProps = {
      collapsed,
      onCollapse,
      depth,
      isHighlighted: shouldHighlight,
      isDragging: ghost,
      darkMode,
      ...restProps,
    };

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
          'sortable-tree-handler'
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
            ...(isNested && {
              borderLeft: '1px dashed var(--border-weak, var(--icon-weak))',
              padding: '0 0 0 16px',
            }),
          }}
        >
          {renderItem ? renderItem(value, itemRenderProps) : null}
        </div>
      </li>
    );
  }
);

TreeItem.displayName = 'TreeItem';
