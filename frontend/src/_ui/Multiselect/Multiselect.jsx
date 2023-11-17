import React, { useState, useEffect } from 'react';
import { MultiSelect } from 'react-multi-select-component';

const Multiselect = (props) => {
  const [optionData, setOptionData] = useState([]);
  const tempOptionData = [];

  const renameKeys = (data) => {
    data?.map((item) => {
      tempOptionData.push({ label: item.name, value: item.value });
    });
    setOptionData(tempOptionData);
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
