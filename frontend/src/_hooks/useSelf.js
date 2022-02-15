import React from 'react';
import { generateRandomHslColor } from '@/_helpers/generateHSLAColors';

export function useSelf(socket, appId) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const [self, setSelf] = React.useState({
    x: 0,
    y: 0,
    color: generateRandomHslColor(),
  });

  const updatePresence = React.useCallback(
    (overrides) => {
      const updatedPresence = Object.assign({}, self, overrides);
      setSelf(updatedPresence);

      const socketData = {
        clientId: currentUser.id,
        appId,
        meta: updatedPresence,
        message: 'updatePresense',
      };

      socket.send(
        JSON.stringify({
          event: 'updatePresense',
          data: JSON.stringify(socketData),
        })
      );
    },
    [appId, currentUser.id, self, socket]
  );

  return {
    self,
    updatePresence,
  };
}
