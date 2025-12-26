import React from 'react';
import { components } from 'react-select';
import { CornerDownLeft } from 'lucide-react';

const { Option } = components;

const EditableTagsOption = (props) => {
  const { data } = props;
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
            gap: '8px',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <span
              style={{
                color: 'var(--text-placeholder)',
                fontSize: '14px',
                flexShrink: 0,
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
                wordBreak: 'break-all',
                minWidth: 0,
              }}
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
          wordBreak: 'break-all',
        }}
      >
        {data.label}
      </div>
    </Option>
  );
};

export default EditableTagsOption;
