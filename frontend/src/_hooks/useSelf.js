import React from 'react';
import { generateRandomHslColor } from '@/_helpers/generateHSLAColors';

export function useSelf(socket) {
  const [self, setSelf] = React.useState({
    x: 0,
    y: 0,
    color: generateRandomHslColor(),
  });

  const updatePresence = React.useCallback((overrides) => {
    const updatedPresence = Object.assign({}, overrides);
    setSelf(updatedPresence);
  }, []);
  return {
    self,
    updatePresence,
  };
}
