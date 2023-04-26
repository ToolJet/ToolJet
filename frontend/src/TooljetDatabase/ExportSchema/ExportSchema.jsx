import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

function ExportSchema({ onClick }) {
  return (
    <button className={`export-table-button tj-text-xsm font-weight-500 ghost-black-operation`} onClick={onClick}>
      <SolidIcon name="arrowsortrectangle" width="14" fill={'#889096'} />
      &nbsp;&nbsp;Export table
    </button>
  );
}

export default ExportSchema;
