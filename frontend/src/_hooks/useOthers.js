import React from 'react';
import { throttle } from 'lodash';
export function useOthers(socket) {
  const [users, setUsers] = React.useState({});
  var throttled = throttle((_users) => console.log(_users), 4000);

  React.useEffect(() => {
    socket?.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.message === 'updatePresense') {
        try {
          // throttled(_users);
          setUsers((users) => {
            const _users = { ...users };
            _users[data.clientId] = data.meta;
            return _users;
          });
        } catch (error) {
          console.log(error);
        }
      }
    });
  }, [socket]);

  return users;
}
