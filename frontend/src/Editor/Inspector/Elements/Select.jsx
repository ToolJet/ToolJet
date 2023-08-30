import React from 'react';
import { ToolTip } from './Components/ToolTip';
// import SelectSearch from 'react-select-search';
import SelectSearch from 'react-select';

// eslint-disable-next-line import/no-unresolved
import { useTranslation } from 'react-i18next';

export const Select = ({ param, definition, onChange, paramType, componentMeta }) => {
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;
  const options = paramMeta.options;
  const value = definition ? definition.value : '';
  const { t } = useTranslation();

  return (
    <div className="field mb-3">
      <ToolTip label={displayName} meta={paramMeta} />
      <SelectSearch
        options={options}
        value={value}
        search={true}
        onChange={(newVal) => onChange(param, 'value', newVal, paramType)}
        fuzzySearch
        placeholder={t('globals.select', 'Select') + '...'}
      />
    </div>
  );
};
