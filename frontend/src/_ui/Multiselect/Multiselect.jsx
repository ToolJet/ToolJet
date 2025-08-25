import React, { useState, useEffect } from 'react';
import { MultiSelect } from 'react-multi-select-component';

const Multiselect = (props) => {
  const [optionData, setOptionData] = useState([]);
  const tempOptionData = [];

  const renameKeys = (data) => {
    data?.map((item) => {
      tempOptionData.push({
      label: item.label ?? item.name,     // keep label or fallback to name
      value: item.value,
      default: item.default ?? false,     // default to false if not provided
      disabled: item.disable ?? false,    // default to false
      visible: item.visible ?? true       // default to true
    });
    });
    setOptionData(tempOptionData.filter(option => option.visible));
  };

  useEffect(() => {
    if (Array.isArray(props?.options)) {
      renameKeys(props.options);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.options?.length]);

  const onChangeHandler = (data) => {
    props.onChange(data);
  };
  return (
    <div>
      <MultiSelect
        disabled={props?.disabled}
        options={optionData}
        placeholder={props?.placeholder}
        value={props?.value || []}
        onChange={onChangeHandler}
        labelledBy="Select"
        overrideStrings={props.overrideStrings}
        disableSearch={props?.disableSearch || false}
      />
    </div>
  );
};

export default Multiselect;
