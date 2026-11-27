import React from 'react';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';

// A page or page group menu row, drawn like the query menu's rows (`.list-item-popover-option`). Icons take the
// theme's icon color: their own default fills are fixed hexes, and "editable" is near-black on the dark menu.
// Disabled rows use aria-disabled, not the native attribute or the global .disabled class: both stop hover
// events, and the row's tooltip says why it is disabled (PG-31: "Home page can't be deleted").
const ignoreClick = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const PageOptions = ({ text, icon, onClick, disabled, danger = false }) => (
  <button
    type="button"
    className="list-item-popover-option"
    aria-disabled={disabled || undefined}
    onClick={disabled ? ignoreClick : onClick}
  >
    <span className="list-item-popover-menu-option-icon">
      <SolidIcon
        name={icon}
        width="16"
        fill={danger ? 'var(--editor-text-danger, var(--text-danger))' : 'var(--icons-default)'}
      />
    </span>
    <span className={cx('list-item-option-menu-label', { 'tw-text-editor-text-danger': danger })}>{text}</span>
  </button>
);

export default PageOptions;
