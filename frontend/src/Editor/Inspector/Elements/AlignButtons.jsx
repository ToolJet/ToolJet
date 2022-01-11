import React from 'react';
import { ToolTip } from './Components/ToolTip';
import AlignLeftIcon from '@/Editor/Icons/align-left.svg';
import AlignRightIcon from '@/Editor/Icons/align-right.svg';
import AlignCenterIcon from '@/Editor/Icons/align-center.svg';
import AlignJustifiedIcon from '@/Editor/Icons/align-justified.svg';

export const AlignButtons = ({ param, definition, onChange, paramType, componentMeta }) => {
  const initialValue = definition ? definition.value : '';
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;
  const options = paramMeta.options || {};

  function handleOptionChanged(event) {
    onChange(param, 'value', event.currentTarget.value, paramType);
  }

  return (
    <div className={`mb-2 field ${options.className}`}>
      <ToolTip label={displayName} meta={paramMeta} />
      <div style={{ display: 'flex' }}>
        <label className="radio-img">
          <input
            type="radio"
            name="alignment"
            value="left"
            onChange={handleOptionChanged}
            checked={initialValue === 'left'}
          />
          <div className="action-icon">
            <AlignLeftIcon />
          </div>
          <span className="tooltiptext">Left</span>
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
            <AlignRightIcon />
          </div>
          <span className="tooltiptext">Right</span>
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
            <AlignCenterIcon />
          </div>
          <span className="tooltiptext">Center</span>
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
            <AlignJustifiedIcon />
          </div>
          <span className="tooltiptext">Justified</span>
        </label>
      </div>
    </div>
  );
};
