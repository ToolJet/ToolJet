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
        backgroundColor: tagBackgroundColor,
        color: selectedTextColor,
      }}
    >
      <span
        className="editable-tag-chip-label"
      >
        {data.label}
      </span>
      <span
        {...removeProps}
        className="editable-tag-chip-remove"
        onClick={(e) => {
          e.stopPropagation();
          removeProps.onClick(e);
        }}
      >
        <IconX size={16} stroke={2} fill={'#000'} opacity={0.2} />
      </span>
    </div>
  );
};

export default EditableTagsChip;
