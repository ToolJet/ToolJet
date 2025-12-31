import React from 'react';
import { components } from 'react-select';
import { CornerDownLeft } from 'lucide-react';

const { Option } = components;

const TagsInputOption = (props) => {
  const { data, selectProps } = props;
  const { tagBackgroundColor, selectedTextColor } = selectProps || {};
  // Check if this is a "create new" option from react-select/creatable
  const isCreateOption = data?.__isNew__;

  if (isCreateOption) {
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
                backgroundColor: tagBackgroundColor || undefined,
                color: selectedTextColor || undefined,
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
          backgroundColor: tagBackgroundColor || undefined,
          color: selectedTextColor || undefined,
        }}
      >
        {data.label}
      </div>
    </Option>
  );
};

export default TagsInputOption;
