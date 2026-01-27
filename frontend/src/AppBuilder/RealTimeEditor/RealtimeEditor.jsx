/* eslint-disable import/no-unresolved */
import React from 'react';
import config from 'config';
import { RoomProvider } from '@y-presence/react';
import Spinner from '@/_ui/Spinner';
// import { Editor } from '@/Editor';
import { Editor } from '@/AppBuilder';
import useStore from '@/AppBuilder/_stores/store';
const Y = require('yjs');
const psl = require('psl');
const { WebsocketProvider } = require('y-websocket');

const ydoc = new Y.Doc();

const getWebsocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const apiUrlStartsWithProtocol = config.apiUrl.startsWith('http');

  let url;

  if (apiUrlStartsWithProtocol) {
    url = `${config.apiUrl.replace(/(^\w+:|^)\/\//, '').replace('/api', '')}`;
  } else {
    url = `${window.location.host}${config.apiUrl.replace(/(^\w+:|^)\/\//, '').replace('/api', '')}`;
  }

  return `${protocol}://${url}`;
};

export const RealtimeEditor = (props) => {
  const appId = props.id;
  const [provider, setProvider] = React.useState();
  const multiPlayerEdit = window?.public_config?.ENABLE_MULTIPLAYER_EDITING === 'true';
  const setYMap = useStore((state) => state.multiplayer.setYMap);
  const processUpdate = useStore((state) => state.multiplayer.processUpdate);

  React.useEffect(() => {
    /* TODO: when we convert the editor.jsx to fn component. please try to avoid this extra call */
    const domain = psl.parse(window.location.host).domain;
    document.cookie = domain ? `domain=.${domain}; path=/` : `path=/`;
    document.cookie = domain ? `app_id=${appId}; domain=.${domain}; path=/` : `app_id=${appId}; path=/`;
    document.cookie = `app_id=${appId}; domain=.${domain}; path=/`;
    if (multiPlayerEdit) {
      setProvider(new WebsocketProvider(getWebsocketUrl(), 'yjs', ydoc));

      const ymap = ydoc.getMap('updates');
      setYMap(ymap);

      ymap.observeDeep((event, transaction) => {
        const update = ymap.get('updates');
        if (transaction.local != true) {
          processUpdate(update);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const initialPresence = {
    firstName: '',
    lastName: '',
    email: '',
    image: '',
    editingVersionId: '',
    x: 0,
    y: 0,
    color: '',
  };

  if (multiPlayerEdit) {
    if (!provider) return <Spinner />;
  } else {
    return <Editor {...props} />;
  }

  return (
    <RoomProvider awareness={provider.awareness} initialPresence={initialPresence}>
      <Editor provider={provider} {...props} />
    </RoomProvider>
  );
};
