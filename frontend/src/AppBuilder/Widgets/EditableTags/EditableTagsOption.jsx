import React from 'react';
import { components } from 'react-select';
import { CornerDownLeft } from 'lucide-react';

const { Option } = components;

const EditableTagsOption = (props) => {
  const { data } = props;
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
          className: `${props.innerProps?.className || ''} editable-tags-create-option-wrapper`,
        }}
      >
        <div
          className="editable-tags-new-tag-preview"
        >
          <div className='add-text'>
            <span>
              add
            </span>
            <span
              className='editable-tags-new-tag-preview-text'
            >
              {data.value}
            </span>
          </div>
          <CornerDownLeft size={16} color="var(--text-placeholder)" style={{ flexShrink: 0 }} />
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
        className="editable-tags-option-chip d-inline-flex"
      >
        {data.label}
      </div>
    </Option>
  );
};

export default EditableTagsOption;
