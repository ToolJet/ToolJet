import React from 'react';

export const LibraryComponent = ({ height, dataCy }) => {
  return (
    <div
      data-cy={dataCy}
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed var(--cc-primary-brand)',
        borderRadius: '4px',
        background: 'color-mix(in srgb, var(--cc-primary-brand) 8%, transparent)',
        color: 'var(--cc-primary-brand)',
        fontSize: '12px',
      }}
    >
      Slot
    </div>
  );
};
