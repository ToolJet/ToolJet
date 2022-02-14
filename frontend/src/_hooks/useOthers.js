import React from 'react';

export function useOthers(socket) {
  const [users, setUsers] = React.useState({});

  socket?.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);
    if (data.message === 'subscribe') {
      console.log('ddd', data);
      users[data.clientId] = data.meta;
      setUsers(users);
    }
  });

  return users;
}
