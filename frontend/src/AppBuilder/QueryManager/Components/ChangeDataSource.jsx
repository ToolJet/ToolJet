import React, { useState } from 'react';
import Select from '@/_ui/Select';
import { decodeEntities } from '@/_helpers/utils';
import usePopoverObserver from '@/AppBuilder/_hooks/usePopoverObserver';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import CodeHinter from '@/AppBuilder/CodeEditor';

export const ChangeDataSource = ({
  dataSources,
  onChange,
  value,
  isVersionReleased,
  fxActive,
  fxValue,
  onFxToggle,
  onFxValueChange,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  usePopoverObserver(
    document.getElementsByClassName('query-details')[0],
    document.querySelector('.change-data-source-select.react-select__control'),
    document.querySelector('.change-data-source-select.react-select__menu'),
    isMenuOpen,
    () => (document.querySelector('.change-data-source-select.react-select__menu').style.display = 'block'),
    () => (document.querySelector('.change-data-source-select.react-select__menu').style.display = 'none')
  );

  return (
    <div className="d-flex align-items-center" style={{ gap: '4px', width: '100%' }}>
      <div className="tw-flex-grow">
        {fxActive ? (
          <CodeHinter
            type="basic"
            initialValue={fxValue ?? ''}
            onChange={(value) => onFxValueChange(value)}
            placeholder="{{dataSources.myDatabase.id}}"
            cyLabel="data-source-fx-input"
          />
        ) : (
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
            customClassPrefix="change-data-source-select"
            onMenuOpen={() => {
              setIsMenuOpen(true);
            }}
            onMenuClose={() => {
              setIsMenuOpen(false);
            }}
          />
        )}
      </div>
      {onFxToggle && <FxButton active={fxActive} onPress={onFxToggle} dataCy="data-source" />}
    </div>
  );
};
