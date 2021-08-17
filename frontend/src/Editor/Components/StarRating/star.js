import React from 'react'
import { animated } from 'react-spring';

const Star = ({ active, ...rest }) => {
  return (
    <animated.span {...rest} className="star" role="button">
      {active ? '\u2605' : '\u2606'}
    </animated.span>
  );
};

export default Star
