import React from 'react'

const Star = ({ active, ...rest }) => {
  return (
    <span {...rest} className="star" role="button">
      {active ? '\u2605' : '\u2606'}
    </span>
  );
};

export default Star
