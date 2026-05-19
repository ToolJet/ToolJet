import React from 'react';

const FlexContainerEmptyPlaceholder = () => {
  return (
    <div
      data-cy="flex-container-empty-placeholder"
      style={{
        height: '64px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed var(--cc-weak-border, #d1d5db)',
        borderRadius: '6px',
        color: 'var(--cc-secondary-text, #6b7280)',
        fontSize: '13px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      Drop a component here
    </div>
  );
};

export { FlexContainerEmptyPlaceholder };
