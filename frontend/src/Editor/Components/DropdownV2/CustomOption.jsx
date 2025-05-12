import React from 'react';
import { components } from 'react-select';
import CheckMark from '@/_ui/Icon/bulkIcons/CheckMark';
import './dropdownV2.scss';
import { highlightText } from './utils';

const CustomOption = (props) => {
  return (
    <components.Option
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
      <div className="cursor-pointer">
        {props.isSelected && (
          <span style={{ maxHeight: '20px', marginRight: '8px', marginLeft: '-28px' }}>
            <CheckMark width={'20'} fill={'var(--cc-primary-brand)'} />
          </span>
        )}
        <span style={{ color: props.isDisabled ? 'var(--cc-disabled-text)' : 'unset', wordBreak: 'break-all' }}>
          {highlightText(props.label?.toString(), props.selectProps.inputValue)}
        </span>
      </div>
    </components.Option>
  );
};

export default CustomOption;
