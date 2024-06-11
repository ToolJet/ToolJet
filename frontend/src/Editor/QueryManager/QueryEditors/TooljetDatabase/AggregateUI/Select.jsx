import React from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import cx from 'classnames';
import { ToolTip } from '@/_components/ToolTip';

export const SelectBox = ({ options, onClick, width, height, value = '' }) => {
  const validOptionStructure = options.map(({ description = '', ...rest }) => {
    return rest;
  });
  return (
    <Select
      options={validOptionStructure}
      value={value}
      //   onChange={(value) => {
      //     statusValuesChanged(value);
      //     setStatusVal(value);
      //   }}
      height={height}
      useMenuPortal={true}
      closeMenuOnSelect={true}
      width={width}
      search={true}
    />
  );
};
