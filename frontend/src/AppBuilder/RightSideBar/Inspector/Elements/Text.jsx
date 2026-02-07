import React from 'react';
import { ToolTip } from './Components/ToolTip';
import { useTranslation } from 'react-i18next';
import { camelCase } from 'lodash';

export const Text = ({ param, definition, onChange, paramType, componentMeta }) => {
  const { t } = useTranslation();
  const value = definition ? definition.value : '';
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = t(`widget.commonProperties.${camelCase(param.name)}`, paramMeta.displayName || param.name);

  return (
    <div className="field mb-3">
      <ToolTip className="color-black" label={displayName} meta={paramMeta} />
      <input
        type="text"
        onBlur={(e) => onChange(param, 'value', e.target.value, paramType)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onChange(param, 'value', e.target.value, paramType);
          }
        }}
        className="form-control text-field"
        name=""
        defaultValue={value}
      />
    </div>
  );
};
