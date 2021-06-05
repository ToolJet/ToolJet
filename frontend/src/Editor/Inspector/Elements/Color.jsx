import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import { ToolTip } from './Components/ToolTip';

export const Color = ({
  param, definition, onChange, paramType, componentMeta
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px'
  };

  const paramMeta = componentMeta[paramType][param.name] || {};
  const displayName = paramMeta.displayName || param.name;

  return (
    <div className="field mb-2">
      <ToolTip label={displayName} meta={paramMeta}/>

      {showPicker && (
        <div>
          <div style={coverStyles} onClick={() => setShowPicker(false)} />
          <SketchPicker
            onFocus={() => setShowPicker(true)}
            color={definition.value}
            onChangeComplete={(color) => onChange(param, 'value', color.hex, paramType)}
          />
        </div>
      )}

      <div className="row mx-1 color-picker-input" onClick={() => setShowPicker(true)}>
        <div className="col-auto" style={{width: '40px', height: '30px'}}  style={{backgroundColor: definition.value}}>
        </div>
        <div className="col">
          {definition.value}
        </div>
      </div>
    </div>
  );
};
