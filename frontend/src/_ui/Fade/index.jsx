import React from 'react';
import { useSpring, animated } from 'react-spring';
import useHover from '@/_hooks/useHover';

export function Fade({ children, visible, ...rest }) {
  const [hoverRef, isHovered] = useHover();

  return (
    <animated.div ref={hoverRef} {...rest} style={useSpring({ opacity: visible || isHovered ? 1 : 0 })}>
      {children}
    </animated.div>
  );
}
