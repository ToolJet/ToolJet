import React from 'react';
import Select from '@/_ui/Select';

export const ChangeDataSource = ({ dataSources, onChange, value, selectedQuery }) => {
  return (
    <Select
      className="px-4"
      options={dataSources
        .filter((ds) => ds.kind === selectedQuery?.kind)
        .map((ds) => ({ label: ds.name, value: ds.id }))}
      value={value.id}
      onChange={(value) => {
        const dataSource = dataSources.find((ds) => ds.id === value);
        onChange(dataSource);
      }}
      useMenuPortal={true}
    />
  );
};
