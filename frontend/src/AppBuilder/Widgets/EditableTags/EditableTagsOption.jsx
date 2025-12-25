import React from 'react';
import { components } from 'react-select';
import { CornerDownLeft } from 'lucide-react';

const { Option } = components;

const EditableTagsOption = (props) => {
  const { data, selectProps, isSelected, isFocused } = props;
  // Use default neutral background for dropdown options (not tagBackgroundColor)
  const optionBackgroundColor = 'var(--surfaces-surface-03)';
  const optionTextColor = 'var(--text-primary)';

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
          className="editable-tags-create-option"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                backgroundColor: optionBackgroundColor,
                color: optionTextColor,
                padding: '2px 8px',
                borderRadius: '2px',
                fontSize: '14px',
                lineHeight: '20px',
              }}
            >
              {data.value}
            </span>
          </div>
          <CornerDownLeft size={16} color="var(--text-placeholder)" />
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
          backgroundColor: optionBackgroundColor,
          color: optionTextColor,
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
