import React from 'react'
import { animated } from 'react-spring';

const Star = ({ active, color, ...rest }) => {
  return (
    <animated.span {...rest} style={{color}} className="star" role="button">
      {active ? '\u2605' : '\u2606'}
    </animated.span>
  );
};

export default Star
