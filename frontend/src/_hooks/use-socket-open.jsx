import React from 'react';
/* Created to avoid more useEffect inside the editor */
export const useSocketOpen = (socket) => {
  const [status, setStatus] = React.useState(false);
  React.useEffect(() => {
    if (socket instanceof WebSocket) {
      socket.addEventListener('open', () => {
        setStatus(true);
      });
    }
  }, [socket]);
  return status;
};
