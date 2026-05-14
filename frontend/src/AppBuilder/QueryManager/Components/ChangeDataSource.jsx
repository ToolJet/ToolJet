import React, { useState } from 'react';
import Select from '@/_ui/Select';
import { decodeEntities } from '@/_helpers/utils';
import usePopoverObserver from '@/AppBuilder/_hooks/usePopoverObserver';

export const ChangeDataSource = ({ dataSources, onChange, value, isVersionReleased }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDummy = !!value?.is_dummy;

  usePopoverObserver(
    document.getElementsByClassName('query-details')[0],
    document.querySelector('.change-data-source-select.react-select__control'),
    document.querySelector('.change-data-source-select.react-select__menu'),
    isMenuOpen,
    () => (document.querySelector('.change-data-source-select.react-select__menu').style.display = 'block'),
    () => (document.querySelector('.change-data-source-select.react-select__menu').style.display = 'none')
  );

  const select = (
    <Select
      className="w-100"
      options={dataSources.map((ds) => ({
        label: ds.is_dummy ? 'Undefined data source' : decodeEntities(ds.name),
        value: ds.id,
      }))}
      value={value?.id}
      onChange={(value) => {
        const dataSource = dataSources.find((ds) => ds.id === value);
        onChange(dataSource);
      }}
      useMenuPortal={true}
      isDisabled={isVersionReleased}
      customClassPrefix="change-data-source-select"
      onMenuOpen={() => {
        setIsMenuOpen(true);
      }}
      onMenuClose={() => {
        setIsMenuOpen(false);
      }}
    />
  );

  // Wrap in an outer div so the danger border lives outside the react-select
  // control. Bumping the inner Select's height bumps its control too, which
  // re-clips the border. Outer wrapper avoids that entirely.
  if (isDummy) {
    return <div className="tw-border tw-border-solid tw-border-border-danger-strong tw-rounded tw-p-px">{select}</div>;
  }
  return select;
};
