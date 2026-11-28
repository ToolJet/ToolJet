import React from 'react';
import cx from 'classnames';
import PanelCloseButton from './PanelCloseButton';
import './panel.scss';

/**
 * Title row of an editor panel (left panel, right panel): 48px tall, title on the left, optional
 * actions and the close button on the right, pinned while the panel scrolls.
 * `divider` is off for panels whose next row (tabs, search) draws its own line.
 */
const PanelHeader = ({
  title,
  onClose,
  closeLabel,
  closeDataCy,
  titleDataCy,
  leading,
  children,
  divider = true,
  className,
  titleClassName,
}) => (
  <div className={cx('tj-panel-header', { 'tj-panel-header--divider': divider }, className)}>
    {leading}
    <span className={cx('tj-panel-header__title', titleClassName)} data-cy={titleDataCy}>
      {title}
    </span>
    <div className="tj-panel-header__actions">
      {children}
      {onClose && <PanelCloseButton label={closeLabel} onClose={onClose} dataCy={closeDataCy} />}
    </div>
  </div>
);

export default PanelHeader;
