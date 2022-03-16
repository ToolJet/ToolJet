import React from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { PresenceProvider } from 'y-presence';
import RealtimeCursors from '@/Editor/RealtimeCursors';
import Spinner from '@/_ui/Spinner';

const ydoc = new Y.Doc();

export const RealtimeEditor = (props) => {
  const appId = props.match.params.id;
  const [provider, setProvider] = React.useState();

  React.useEffect(() => {
    setProvider(new WebrtcProvider(`tooljet-appId-${appId}`, ydoc));

    () => provider.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  if (!provider) return <Spinner />;

  return (
    <PresenceProvider awareness={provider.awareness}>
      <RealtimeCursors ymap={ydoc.getMap('appDef')} {...props} />
    </PresenceProvider>
  );
};
