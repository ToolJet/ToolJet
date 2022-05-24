/* eslint-disable import/no-unresolved */
import React from 'react';
import config from 'config';
import { PresenceProvider } from 'y-presence';
import RealtimeCursors from '@/Editor/RealtimeCursors';
import Spinner from '@/_ui/Spinner';
const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');

const ydoc = new Y.Doc();

const getWebsocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const re = /https?:\/\//g;
  if (re.test(config.apiUrl)) return `${protocol}://${config.apiUrl.replace(/(^\w+:|^)\/\//, '').replace('/api', '')}`;

  return `${protocol}://${window.location.host}`;
};

export const RealtimeEditor = (props) => {
  const appId = props.match.params.id;
  const [provider, setProvider] = React.useState();

  React.useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    document.cookie = `auth_token=${currentUser?.auth_token}; path=/`;
    setProvider(new WebsocketProvider(getWebsocketUrl(), 'yjs', ydoc));
  }, [appId]);

  React.useEffect(() => {
    const ERROR_CODE_WEBSOCKET_AUTH_FAILED = 4000;
    if (provider) {
      provider?.on('connection-close', (e) => {
        if (e.code === ERROR_CODE_WEBSOCKET_AUTH_FAILED) provider.disconnect();
      });
    }

    () => provider.disconnect();
  }, [provider]);

  if (!provider) return <Spinner />;

  return (
    <PresenceProvider awareness={provider.awareness}>
      <RealtimeCursors ymap={ydoc.getMap('appDef')} {...props} />
    </PresenceProvider>
  );
};
