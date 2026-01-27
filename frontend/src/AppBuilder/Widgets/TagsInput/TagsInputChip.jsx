import React from 'react';
import { IconX } from '@tabler/icons-react';

const TagsInputChip = (props) => {
  const { data, removeProps, selectProps } = props;
  const { getChipColor } = selectProps || {};

  // Get the chip colors using the getChipColor function (returns { bg, text })
  const chipColors = getChipColor ? getChipColor(data.value) : { bg: 'var(--surfaces-surface-03)', text: 'var(--text-primary)' };

  return (
    <div
      className="tags-input-chip"
      style={{
        backgroundColor: chipColors.bg,
        color: chipColors.text,
      }}
    >
      <span
        className="tags-input-chip-label"
      >
        {data.label}
      </span>
      <span
        {...removeProps}
        className="tags-input-chip-remove"
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

export default TagsInputChip;
