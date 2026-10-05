import React from 'react';
import Icon from '@/_ui/Icon/solidIcons/index';

const ValidationRangeWarning = ({ message }) => (
  <div className="d-flex" style={{ padding: '8px 12px', gap: '6px', backgroundColor: '#FCEEEF', borderRadius: '6px' }}>
    <span>
      <Icon name={'warning'} height={14} width={14} fill="#DB4324" />
    </span>
    <span style={{ color: '#2D343B', fontSize: '12px' }}>{message}</span>
  </div>
);

export default ValidationRangeWarning;
