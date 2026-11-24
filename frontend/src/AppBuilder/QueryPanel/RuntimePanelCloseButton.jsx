import React from 'react';
import cx from 'classnames';
import { X } from 'lucide-react';
import { ToolTip } from '@/_components/ToolTip';
import { getRuntimeToggleLabel } from '@/AppBuilder/panelLayout';
import { useCodeMode } from '@/AppBuilder/_helpers/codeModeHooks';

// Collapses the bottom runtime panel; sits at the right end of the Inspector and Debugger toolbars.
const RuntimePanelCloseButton = ({ tab, onClose, dataCy, className }) => {
  const label = getRuntimeToggleLabel(true, tab, useCodeMode());
  return (
    <ToolTip message={label} placement="top">
      <button
        type="button"
        className={cx('runtime-inspector__icon-btn runtime-inspector__close', className)}
        onClick={onClose}
        aria-label={label}
        data-cy={dataCy}
      >
        <X size={14} />
      </button>
    </ToolTip>
  );
};

export default RuntimePanelCloseButton;
