import React from 'react';
import { Editor } from '@/Editor';
import { Cursor } from '@/Editor/Cursor';
import { useSelf } from '@/_hooks/useSelf';
import { useOthers } from '@/_hooks/useOthers';
import { createWebsocketConnection } from '@/_helpers/websocketConnection';

const MultiplayerEditor = (props) => {
  const { socket } = React.useMemo(() => createWebsocketConnection(props.match.params.id), [props.match.params.id]);

  const { updatePresence } = useSelf(socket);

  const others = useOthers(socket);

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
    <div onPointerMove={handlePointerMove}>
      <Editor {...props} socket={socket} />
      {Object.keys(others).map((key) => {
        return <Cursor key={key} color={others[key].color} x={others[key].x} y={others[key].y} />;
      })}
    </div>
  );
};

export { MultiplayerEditor };
