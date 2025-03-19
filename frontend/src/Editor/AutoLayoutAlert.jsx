import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export default function AutoLayoutAlert({ show, onClick }) {
  if (!show) {
    return '';
  }
  return (
    <div
      style={{
        position: 'absolute',
        top: '0',
        right: '0',
        width: '300px',
        padding: 'var(--7, 16px)',
        background: 'var(--base)',
        margin: '10px',
      }}
      className="d-flex flex-row"
    >
      <div className="pe-2">
        <SolidIcon name="warning" fill="#E54D2E" />
      </div>
      <div style={{ fontSize: '12px', fontStyle: 'normal', fontWeight: '400', lineHeight: '20px' }}>
        You have to disable auto alignment to manually adjust mobile components. Once disabled, the mobile layout will
        not automatically align with desktop changes
        <ButtonSolid
          size="sm"
          variant="tertiary"
          onClick={onClick}
          className="mt-2"
          data-cy="disable-auto-alignment-button"
        >
          Disable auto alignment
        </ButtonSolid>
      </div>
    </div>
  );
}
