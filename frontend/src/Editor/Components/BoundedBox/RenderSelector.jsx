import React from 'react';
import { Box } from './Box';
// eslint-disable-next-line no-unused-vars
export const RenderSelector = ({ annotation, active, fireEvent }) => {
  let { geometry } = annotation;
  if (!geometry) return null;
  return (
    <Box
      geometry={geometry}
      style={{
        background: 'rgba(255, 255, 255, 0.5)',
        border: 'solid 1px red',
      }}
    ></Box>
  );
};
