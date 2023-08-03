import React from 'react';
import config from 'config';
import MUIDivider from '@mui/material/Divider';

export const Divider = function Divider({ styles, dataCy }) {
  const { visibility, dividerColor, boxShadow } = styles;
  const color = dividerColor ?? '#E7E8EA';

  return (
    <>
      {config.UI_LIB === 'tooljet' && (
        <div
          className="hr mt-1"
          style={{ display: visibility ? '' : 'none', color: color, opacity: '1', boxShadow }}
          data-cy={dataCy}
        ></div>
      )}
      {config.UI_LIB === 'mui' && (
        <div className="Divider MUI" style={{ display: 'flex', height: '40px', alignItems: 'center' }}>
          <MUIDivider
            style={{ display: visibility ? '' : 'none', backgroundColor: color, opacity: 1, boxShadow, width: '100%' }}
          />
        </div>
      )}
    </>
  );
};
