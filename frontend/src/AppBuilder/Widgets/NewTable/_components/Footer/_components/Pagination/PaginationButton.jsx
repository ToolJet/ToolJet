import React, { memo } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const PaginationButton = memo(({ pageIndex, onClick, disabled, icon, dataCy, currentPageIndex, className }) => {
  const isSelected = pageIndex && currentPageIndex && pageIndex === currentPageIndex;

  return (
    <ButtonSolid
      variant="ghostBlack"
      className={`tj-text-sm table-pagination-btn ${isSelected && 'selected'} ${className}`}
      leftIcon={icon}
      fill={disabled ? 'var(--slate8)' : 'var(--cc-primary-icon, var(--cc-default-icon))'}
      iconWidth="16"
      isTablerIcon={true}
      size="md"
      onClick={onClick}
      disabled={disabled}
      data-cy={dataCy}
    >
      {pageIndex}
    </ButtonSolid>
  );
});
