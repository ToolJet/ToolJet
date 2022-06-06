/* eslint-disable import/no-unresolved */
import React from 'react';
import config from 'config';
import { RoomProvider } from '@y-presence/react';
import Spinner from '@/_ui/Spinner';
import { Editor } from '@/Editor';

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

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const initialPresence = {
    firstName: currentUser.first_name,
    lastName: currentUser.last_name,
    image: '',
    editingVersionId: '',
    x: 0,
    y: 0,
    color: '',
  };

  return (
    <RoomProvider awareness={provider.awareness} initialPresence={initialPresence}>
      <Editor provider={provider} ymap={ydoc.getMap('appDef')} {...props} />
    </RoomProvider>
  );
};
