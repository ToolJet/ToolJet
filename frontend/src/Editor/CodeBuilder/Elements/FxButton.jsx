import React from 'react';

export default function FxButton({ active, onPress }) {
  return (
    <div className={`fx-button ${active ? 'active' : ''} unselectable`} onClick={onPress}>
      Fx
    </div>
  );
}
