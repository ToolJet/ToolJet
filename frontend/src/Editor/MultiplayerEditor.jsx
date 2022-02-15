import React from 'react';
import { Editor } from '@/Editor';
import { Cursor } from '@/Editor/Cursor';
import { useSelf } from '@/_hooks/useSelf';
import { useOthers } from '@/_hooks/useOthers';
import { createWebsocketConnection } from '@/_helpers/websocketConnection';

const MultiplayerEditor = (props) => {
  const { socket } = React.useMemo(() => createWebsocketConnection(props.match.params.id), [props.match.params.id]);

  const { updatePresence } = useSelf(socket, props.match.params.id);

  const [users, setUsers] = React.useState({});

  socket?.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.message === 'updatePresense') {
      try {
        // throttled(_users);
        setUsers((users) => (users[data.clientId] = data.meta));
      } catch (error) {
        console.log(error);
      }
    }
  });

  // const others = useOthers(socket);

  // console.log('222', others);

  const handlePointerMove = React.useCallback(
    (e) => {
      updatePresence({
        x: e.clientX,
        y: e.clientY,
      });
    },
    [updatePresence]
  );

  React.useEffect(() => {
    () => socket && socket?.close();
  }, [socket]);

  return (
    <div onPointerMove={handlePointerMove} style={{ height: '100vh', width: '100%' }}>
      {/* <Editor {...props} socket={socket} /> */}
      {Object.keys(users).map((key) => {
        return <Cursor key={key} color={users[key].color} x={users[key].x} y={users[key].y} />;
      })}
    </div>
  );
};

export { MultiplayerEditor };
