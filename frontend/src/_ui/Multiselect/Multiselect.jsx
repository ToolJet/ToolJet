import React, { useState, useEffect } from 'react';
import { MultiSelect } from 'react-multi-select-component';

const Multiselect = (props) => {
  const [selected, setSelected] = useState([]);
  const [optionData, setOptionData] = useState([]);
  const tempOptionData = [];

  const renameKeys = (data) => {
    data?.map((item) => {
      tempOptionData.push({ label: item.name, value: item.value });
    });
    setOptionData(tempOptionData);
  };

  useEffect(() => {
    renameKeys(props.options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props?.options]);

  const onChangeHandler = (data) => {
    setSelected(data);
    props.onChange(data);
  };
  return (
    <div>
      <MultiSelect
        options={optionData}
        placeholder={props.placeholder}
        value={selected}
        onChange={onChangeHandler}
        labelledBy="Select"
        overrideStrings={props.overrideStrings}
      />
    </div>
  );
};

export default Multiselect;
