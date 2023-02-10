import React from 'react';
import cx from 'classnames';
import Skeleton from 'react-loading-skeleton';

export function Menu({ isLoading, onChange, items, selected }) {
  return (
    <div className="left-menu card">
      <ul data-cy="left-menu-items">
        {!isLoading &&
          Array.isArray(items) &&
          items.length > 0 &&
          items.map((item) => (
            <li
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cx({
                active: selected === item.id,
              })}
            >
              {item.label}
            </li>
          ))}
      </ul>
      {isLoading && <Skeleton count={4} />}
    </div>
  );
}
