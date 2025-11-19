import React, { memo } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const PaginationButton = memo(({ pageIndex, onClick, disabled, icon, dataCy, currentPageIndex, className }) => {
  return (
    <ButtonSolid
      variant="ghostBlack"
      className={`tj-text-sm table-pagination-btn ${
        pageIndex &&
        currentPageIndex &&
        pageIndex === currentPageIndex &&
        '!tw-bg-[var(--interactive-overlays-fill-hover)]'
      } ${className}`}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
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
