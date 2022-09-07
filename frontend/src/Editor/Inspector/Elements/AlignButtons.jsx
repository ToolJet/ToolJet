import React from 'react';
import { ToolTip } from './Components/ToolTip';
import { useTranslation } from 'react-i18next';

export const AlignButtons = ({ param, definition, onChange, paramType, componentMeta }) => {
  const initialValue = definition ? definition.value : '';
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;
  const options = paramMeta.options || {};
  const { t } = useTranslation();

  function handleOptionChanged(event) {
    onChange(param, 'value', event.currentTarget.value, paramType);
  }

  return (
    <div className={`mb-3 field ${options.className}`}>
      <ToolTip label={displayName} meta={paramMeta} />
      <div style={{ display: 'flex', gap: 10 }}>
        <label className="radio-img">
          <input
            type="radio"
            name="alignment"
            value="left"
            onChange={handleOptionChanged}
            checked={initialValue === 'left'}
          />
          <div className="action-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 4H14M2 8H8.66667M2 12H12"
                stroke={initialValue == 'left' ? '#fff' : '#8092AC'}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="tooltiptext">{t('globals.left', 'Left')}</span>
        </label>

        <label className="radio-img">
          <input
            type="radio"
            name="alignment"
            value="center"
            onChange={handleOptionChanged}
            checked={initialValue === 'center'}
          />
          <div className="action-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 4H14M4.66667 8H11.3333M3.33333 12H12.6667"
                stroke={initialValue == 'center' ? '#fff' : '#8092AC'}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="tooltiptext">{t('globals.center', 'Center')}</span>
        </label>

        <label className="radio-img">
          <input
            type="radio"
            name="alignment"
            value="right"
            onChange={handleOptionChanged}
            checked={initialValue === 'right'}
          />
          <div className="action-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 4H14M7.33333 8H14M4 12H14"
                stroke={initialValue == 'right' ? '#fff' : '#8092AC'}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="tooltiptext">{t('globals.right', 'Right')}</span>
        </label>

        <label className="radio-img">
          <input
            type="radio"
            name="alignment"
            value="justify"
            onChange={handleOptionChanged}
            checked={initialValue === 'justify'}
          />
          <div className="action-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 8H14M2 12H14M2 4H8H14H2Z"
                stroke={initialValue == 'justify' ? '#fff' : '#8092AC'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="tooltiptext">{t('globals.justified', 'Justified')}</span>
        </label>
      </div>
    </div>
  );
};
