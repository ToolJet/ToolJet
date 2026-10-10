import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import '@/_styles/widgets/kanban.scss';
import cx from 'classnames';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { columnStyleVars } from '../helpers/styleVars';

export const Container = ({ children, id, disabled, ...props }) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  const { kanbanProps, style, label, dataCy, items } = props;
  const {
    styles: { accentColor },
    darkMode,
  } = kanbanProps;
  const shadcn = kanbanProps.properties?.skin === 'shadcn';

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
      ref={disabled ? undefined : setNodeRef}
      style={{
        ...style,
        '--columns': 1,
        ...columnStyleVars(kanbanProps.styles),
      }}
      className={cx('kanban-container', 'scrollable', darkMode && 'dark', shadcn && 'skin-shadcn')}
      onMouseDown={(e) => e.stopPropagation()}
      data-cy={
        dataCy ? `${dataCy}-container-${generateCypressDataCy(label)}` : `${generateCypressDataCy(label)}-container`
      }
    >
      {label ? (
        <div className={cx('header', darkMode && 'dark')}>
          <span
            style={
              shadcn
                ? undefined
                : {
                    ...colAccentColor,
                    ...(kanbanProps.styles?.columnTitleColor ? { color: kanbanProps.styles.columnTitleColor } : {}),
                  }
            }
            className="container-name"
            data-cy={
              dataCy
                ? `${dataCy}-${generateCypressDataCy(label)}-container-header`
                : `${generateCypressDataCy(label)}-container-header`
            }
          >
            {label}
          </span>
          {shadcn ? <span className="container-count">{Array.isArray(items) ? items.length : 0}</span> : null}
        </div>
      ) : null}
      <ul>{children}</ul>
    </div>
  );
};
