import React, { memo } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const PaginationButton = memo(({ onClick, disabled, icon, dataCy }) => {
  return (
    <ButtonSolid
      variant="ghostBlack"
      className="tj-text-xsm table-pagination-btn"
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      leftIcon={icon}
      fill={`var(--icons-default)`}
      iconWidth="14"
      size="md"
      onClick={onClick}
      disabled={disabled}
      data-cy={dataCy}
    ></ButtonSolid>
  );
});
