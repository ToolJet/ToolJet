import React from 'react';
import { components } from 'react-select';
const { Option } = components;
import { FormCheck } from 'react-bootstrap';
import './multiselectV2.scss';

const CustomOption = (props) => {
  return (
    <Option {...props}>
      <div className="d-flex">
        <FormCheck checked={props.isSelected} disabled={props?.isDisabled} />
        <span style={{ marginLeft: '5px' }}>{props?.label}</span>
      </div>
    </Option>
  );
};

export default CustomOption;
