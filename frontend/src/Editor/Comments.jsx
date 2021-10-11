import '@/_styles/editor/comments.scss';

import React from 'react';
import { isEmpty } from 'lodash';
import config from 'config';

import Comment from './Comment';
import { commentsService } from '@/_services';

import useRouter from '@/_hooks/use-router';

const Comments = ({ newThread = {} }) => {
  const [threads, setThreads] = React.useState([]);
  const [socket, setWebSocket] = React.useState(null);
  // const [reload, setReload] = React.useState(false);

  const router = useRouter();

  async function fetchData() {
    const { data } = await commentsService.getThreads(router.query.id);
    setThreads(data);
  }
  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    !isEmpty(newThread) && setThreads([...threads, newThread]);
  }, [newThread]);

  // TODO: add retry policy
  React.useEffect(() => {
    const socket = new WebSocket(`ws://${config.apiUrl.replace('/api', '')}`);

    // Connection opened
    socket.addEventListener('open', function (event) {
      console.log('connection established', event);
    });

    // Connection closed
    socket.addEventListener('close', function (event) {
      console.log('connection closed', event);
    });

    // Listen for possible errors
    socket.addEventListener('error', function (event) {
      console.log('WebSocket error: ', event);
    });

    setWebSocket(socket);

    return () => setWebSocket(null);
  }, []);

  if (isEmpty(threads)) return null;

  return threads.map((thread) => {
    const { id } = thread;
    return <Comment key={id} fetchThreads={fetchData} socket={socket} threadId={id} {...thread} />;
  });
};

export default Comments;
