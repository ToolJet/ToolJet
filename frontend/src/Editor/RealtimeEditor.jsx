import React from 'react';
import { PresenceProvider } from 'y-presence';
import RealtimeCursors from '@/Editor/RealtimeCursors';
import Spinner from '@/_ui/Spinner';
const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');

const ydoc = new Y.Doc();

export const RealtimeEditor = (props) => {
  const appId = props.match.params.id;
  const [provider, setProvider] = React.useState();

  React.useEffect(() => {
    setProvider(new WebsocketProvider('ws://localhost:3000/', '', ydoc));
    () => provider.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  if (!provider) return <Spinner />;

  return (
    <PresenceProvider awareness={provider.awareness}>
      <RealtimeCursors socket={provider.ws} ymap={ydoc.getMap('appDef')} {...props} />
    </PresenceProvider>
  );
};
