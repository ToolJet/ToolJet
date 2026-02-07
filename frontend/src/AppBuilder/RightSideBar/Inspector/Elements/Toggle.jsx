import React from 'react';
import { ToolTip } from './Components/ToolTip';
import { useTranslation } from 'react-i18next';
import { camelCase } from 'lodash';

export const Toggle = ({ param, definition, onChange, paramType, componentMeta }) => {
  const { t } = useTranslation();
  const value = definition?.value !== false ?? false;
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = t(`widget.commonProperties.${camelCase(param.name)}`, paramMeta.displayName || param.name);

  return (
    <div className="field mb-3">
      <label className="form-check form-switch my-2">
        <input
          className="form-check-input"
          type="checkbox"
          onClick={() => onChange(param, 'value', !value, paramType)}
          checked={value}
        />
        <ToolTip label={displayName} meta={paramMeta} labelClass="form-check-label" />
      </label>
    </div>
  );
};
