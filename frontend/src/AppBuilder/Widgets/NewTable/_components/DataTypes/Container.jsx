import React from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';

export const ContainerColumn = ({ id, index, containerWidth, height, darkMode, columnId }) => {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <SubContainer
        id={id}
        index={index}
        canvasWidth={containerWidth}
        canvasHeight={height}
        darkMode={darkMode}
        componentType="TableContainer"
      />
    </div>
  );
};
