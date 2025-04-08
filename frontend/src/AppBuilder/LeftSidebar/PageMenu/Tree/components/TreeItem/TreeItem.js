import React, { forwardRef } from 'react';
import classNames from 'classnames';

import styles from './TreeItem.module.css';
import { PageMenuItem } from '../../../PageMenuItem';
import { PageGroupItem } from '../../../PageGroupItem';

export const TreeItem = forwardRef(
  (
    {
      childCount,
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
      pageGroupToHighlight,
      darkMode,
      ...props
    },
    ref
  ) => {
    const shouldHightlight = pageGroupToHighlight === value?.id;

    return (
      <li
        {...handleProps}
        className={classNames(
          styles.Wrapper,
          clone && styles.clone,
          ghost && styles.ghost,
          indicator && styles.indicator,
          disableSelection && styles.disableSelection,
          disableInteraction && styles.disableInteraction,
          pageGroupToHighlight && styles.removeBorder,
          'page-handler'
        )}
        ref={wrapperRef}
        style={{
          '--spacing': `${indentationWidth * depth}px`,
          ...(pageGroupToHighlight?.id === value?.id && {
            border: '1px solid orange',
          }),
        }}
        {...props}
      >
        <div
          className={styles.TreeItem}
          ref={ref}
          style={{
            ...style,
            width: '100%',
            ...(value?.pageGroupId && {
              borderLeft: '1px solid var(--slate7)',
              padding: '0 0 0 6px',
            }),
          }}
        >
          {!value?.isPageGroup ? (
            <PageMenuItem darkMode={darkMode} page={value} />
          ) : (
            <PageGroupItem
              darkMode={darkMode}
              highlight={shouldHightlight}
              collapsed={collapsed}
              onCollapse={onCollapse}
              page={value}
            />
          )}
        </div>
      </li>
    );
  }
);
