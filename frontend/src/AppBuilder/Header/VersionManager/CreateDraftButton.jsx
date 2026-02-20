import React from 'react';
import cx from 'classnames';
import { ToolTip } from '@/_components/ToolTip';
import { Button } from '@/components/ui/Button/Button';
import './style.scss';

const CreateDraftButton = ({
  onClick,
  disabled = false,
  darkMode = false,
  disabledTooltip = 'Draft version can only be created from saved versions.',
}) => {
  return (
    <div className={cx('create-draft-button', { 'dark-theme theme-dark': darkMode })} style={{ padding: '8px' }}>
      <ToolTip
        message={disabledTooltip}
        tooltipClassName="create-draft-button-tooltip"
        placement="left"
        show={disabled}
      >
        <Button
          variant="outline"
          size="default"
          leadingIcon="plus"
          disabled={disabled}
          onClick={onClick}
          className="tw-w-full"
          data-cy="create-draft-version-button"
        >
          Create draft version
        </Button>
      </ToolTip>
    </div>
  );
};

export default CreateDraftButton;
