import React from 'react';
import { components } from 'react-select';
import { IconX } from '@tabler/icons-react';

const { MultiValue } = components;

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
        gap: '2px',
        padding: '2px 6px 2px 8px',
        backgroundColor: tagBackgroundColor,
        borderRadius: '2px',
        fontSize: '14px',
        lineHeight: '20px',
        color: selectedTextColor !== '#1B1F24' ? selectedTextColor : 'var(--text-primary)',
      }}
    >
      <span className="editable-tag-chip-label">{data.label}</span>
      <span
        {...removeProps}
        className="editable-tag-chip-remove"
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          marginLeft: '2px',
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
