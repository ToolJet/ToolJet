import React from 'react';
import { components } from 'react-select';
const { Option } = components;
import { FormCheck } from 'react-bootstrap';
import './multiselectV2.scss';
import { highlightText } from '../DropdownV2/utils';

const CustomOption = (props) => {
  const labelText = String(props.label ?? '');

  return (
    <Option
      {...props}
      innerProps={{
        ...props.innerProps,
      }}
    >
      <div className="d-flex multiselct-widget-option">
        <FormCheck checked={props.isSelected} disabled={props?.isDisabled} />
        <span style={{ marginLeft: '5px' }}>
          {labelText.includes('Select all') ? 'Select all' : highlightText(labelText, props.selectProps.inputValue)}
        </span>
      </div>
    </Option>
  );
};

export default CustomOption;
