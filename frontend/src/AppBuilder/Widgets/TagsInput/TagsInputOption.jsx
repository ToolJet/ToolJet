import React from 'react';
import { components } from 'react-select';
import { CornerDownLeft } from 'lucide-react';

const { Option } = components;

const TagsInputOption = (props) => {
  const { data, selectProps } = props;
  const { getChipColor, selectedTextColor, tagBackgroundColor, autoPickChipColor } = selectProps || {};
  // Check if this is a "create new" option from react-select/creatable
  const isCreateOption = data?.__isNew__;

  // Get the chip colors using the getChipColor function (returns { bg, text })
  const chipColors = getChipColor ? getChipColor(data.value) : { bg: tagBackgroundColor, text: selectedTextColor };

  if (isCreateOption) {
    // For new tags being created, use the default colors (not auto-picked)
    const newTagBgColor = autoPickChipColor ? undefined : tagBackgroundColor;
    const newTagTextColor = autoPickChipColor ? undefined : selectedTextColor;
    return (
      <Option
        {...props}
        innerProps={{
          ...props.innerProps,
          onTouchEnd: (e) => {
            e.preventDefault();
            e.stopPropagation();
            props.selectOption(props.data);
          },
          className: `${props.innerProps?.className || ''} tags-input-create-option-wrapper`,
        }}
      >
        <div className="tags-input-create-option-inner">
          <div className="tags-input-new-tag-preview">
            <span className="add-text">add</span>
            <span
              className="tags-input-new-tag-preview-text"
              style={{
                backgroundColor: newTagBgColor,
                color: newTagTextColor,
              }}
            >
              {data.value}
            </span>
          </div>
          <CornerDownLeft size={14} color="var(--text-placeholder)" style={{ flexShrink: 0 }} />
        </div>
      </Option>
    );
  }

  return (
    <Option
      {...props}
      innerProps={{
        ...props.innerProps,
        onTouchEnd: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.selectOption(props.data);
        },
      }}
    >
      <div
        className="tags-input-option-chip d-inline-flex"
        style={{
          backgroundColor: chipColors.bg,
          color: chipColors.text,
        }}
      >
        {data.label}
      </div>
    </Option>
  );
};

export default TagsInputOption;
