import React from 'react';
import Select from '@/_ui/Select';
import { decodeEntities } from '@/_helpers/utils';

export const ChangeDataSource = ({ dataSources, onChange, value, isVersionReleased }) => {
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
      isDisabled={isVersionReleased}
    />
  );
};
