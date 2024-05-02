import React from 'react';
import Select from '@/_ui/Select';

function decodeEntities(encodedString) {
  return encodedString.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&');
}

export const ChangeDataSource = ({ dataSources, onChange, value }) => {
  return (
    <Select
      className="w-100"
      options={dataSources.map((ds) => ({ label: decodeEntities(ds.name), value: ds.id }))}
      value={value?.id}
      onChange={(value) => {
        const dataSource = dataSources.find((ds) => ds.id === value);
        onChange(dataSource);
      }}
      useMenuPortal={true}
    />
  );
};
