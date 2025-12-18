import React from 'react';
import { components } from 'react-select';

const { Option } = components;

const EditableTagsOption = (props) => {
  const { data, selectProps, isSelected, isFocused } = props;
  const tagBackgroundColor = selectProps?.tagBackgroundColor || 'var(--surfaces-surface-03)';
  const selectedTextColor = selectProps?.selectedTextColor || 'var(--text-primary)';

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
        }}
      >
        <div
          className="editable-tags-create-option"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              color: 'var(--text-placeholder)',
              fontSize: '14px',
            }}
          >
            add
          </span>
          <span
            style={{
              backgroundColor: tagBackgroundColor,
              color: selectedTextColor !== '#1B1F24' ? selectedTextColor : 'var(--text-primary)',
              padding: '2px 8px',
              borderRadius: '2px',
              fontSize: '14px',
              lineHeight: '20px',
            }}
          >
            {data.value}
          </span>
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
        className="editable-tags-option-chip"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: tagBackgroundColor,
          color: selectedTextColor !== '#1B1F24' ? selectedTextColor : 'var(--text-primary)',
          padding: '2px 8px',
          borderRadius: '2px',
          fontSize: '14px',
          lineHeight: '20px',
        }}
      >
        {data.label}
      </div>
    </Option>
  );
};

export default EditableTagsOption;
