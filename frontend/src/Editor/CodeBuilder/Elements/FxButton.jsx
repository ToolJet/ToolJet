import React from 'react';

export default function FxButton({ active, onPress, dataCy }) {
  return (
    <div
      title="Use fx for property to have a programmatically determined value instead of a fixed value"
      className={`fx-button ${active ? 'active' : ''} unselectable`}
      onClick={onPress}
      data-cy={`${dataCy}-fx-button`}
    >
      fx
    </div>
  );
}
