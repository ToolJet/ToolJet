import React, { forwardRef } from 'react';
import classNames from 'classnames';

import styles from './TreeItem.module.css';
import { DraggableElement } from '../../SortableTree';
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
      onRemove,
      style,
      value,
      wrapperRef,
      ...props
    },
    ref
  ) => {
    // console.log(
    //   value.name,
    //   {
    //     depth,
    //     indentationWidth,
    //   },
    //   `'--spacing': ${indentationWidth * depth}`
    // );
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
          'page-handler'
        )}
        ref={wrapperRef}
        style={{
          '--spacing': `${indentationWidth * depth}px`,
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
              padding: '0 6px',
            }),
          }}
        >
          {!value?.isPageGroup ? (
            <PageMenuItem page={value} />
          ) : (
            <PageGroupItem collapsed={collapsed} onCollapse={onCollapse} page={value} />
          )}
        </div>
      </li>
    );
  }
);

const collapseIcon = (
  <svg width="10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 41">
    <path d="M30.76 39.2402C31.885 40.3638 33.41 40.995 35 40.995C36.59 40.995 38.115 40.3638 39.24 39.2402L68.24 10.2402C69.2998 9.10284 69.8768 7.59846 69.8494 6.04406C69.822 4.48965 69.1923 3.00657 68.093 1.90726C66.9937 0.807959 65.5106 0.178263 63.9562 0.150837C62.4018 0.123411 60.8974 0.700397 59.76 1.76024L35 26.5102L10.24 1.76024C9.10259 0.700397 7.59822 0.123411 6.04381 0.150837C4.4894 0.178263 3.00632 0.807959 1.90702 1.90726C0.807714 3.00657 0.178019 4.48965 0.150593 6.04406C0.123167 7.59846 0.700153 9.10284 1.75999 10.2402L30.76 39.2402Z" />
  </svg>
);
