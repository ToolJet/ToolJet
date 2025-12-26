import React from 'react';
import { IconX } from '@tabler/icons-react';

const EditableTagsChip = (props) => {
  const { data, removeProps, selectProps } = props;
  const tagBackgroundColor = selectProps?.tagBackgroundColor || 'var(--surfaces-surface-03)';
  const selectedTextColor = selectProps?.selectedTextColor || 'var(--text-primary)';

  return (
    <div
      className="editable-tag-chip"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        backgroundColor: tagBackgroundColor,
        borderRadius: '2px',
        fontSize: '14px',
        lineHeight: '20px',
        color: selectedTextColor,
        maxWidth: '100%',
        minWidth: 0,
      }}
    >
      <span
        className="editable-tag-chip-label"
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {data.label}
      </span>
      <span
        {...removeProps}
        className="editable-tag-chip-remove"
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          marginLeft: '2px',
          flexShrink: 0,
        }}
        onClick={(e) => {
          e.stopPropagation();
          removeProps.onClick(e);
        }}
      >
        <IconX size={14} stroke={2} />
      </span>
    </div>
  );
};

export default EditableTagsChip;
