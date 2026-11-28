import React from 'react';
import cx from 'classnames';
import { ChevronDown } from 'lucide-react';
import './panel.scss';

/**
 * Collapsible section header in a panel (Dependencies, Code search, Inspector): optional leading icon,
 * 12/500 title, a muted plain count, and the caret at the end like the panels' accordions (UA-14).
 */
const PanelSectionHeader = ({ title, count, open, onToggle, icon, className, dataCy }) => (
  <button
    type="button"
    className={cx('tj-panel-section-header', className)}
    onClick={onToggle}
    aria-expanded={open}
    data-cy={dataCy}
  >
    {icon}
    <span className="tj-panel-section-header__title">{title}</span>
    {count !== undefined && <span className="tj-panel-section-header__count">{count}</span>}
    <ChevronDown size={14} className={cx('tj-panel-section-header__caret', { 'is-open': open })} />
  </button>
);

export default PanelSectionHeader;
