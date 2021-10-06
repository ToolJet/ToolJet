import '@/_styles/editor/comments.scss';

import React from 'react';
import { isEmpty } from 'lodash';

import Comment from './Comment';
import { commentsService } from '@/_services';

import useRouter from '@/_hooks/use-router';

const Comments = ({ newThread = {} }) => {
  const [threads, setThreads] = React.useState([]);
  const [socket, setWebSocket] = React.useState(null);

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

  React.useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000');

    // Connection opened
    socket.addEventListener('open', function (event) {
      console.log('connection established', event);
      socket.send(
        JSON.stringify({
          event: 'events',
          data: 'test',
        })
      );
    });

    // Connection closed
    socket.addEventListener('close', function (event) {
      console.log('connection closed', event);
    });

    // Listen for messages
    socket.addEventListener('message', function (event) {
      console.log('Message from server ', event.data);
    });

    setWebSocket(socket);

    return () => setWebSocket(null);
  }, []);

  if (isEmpty(threads)) return null;

  return threads.map((thread) => {
    const { id } = thread;
    return <Comment key={id} socket={socket} threadId={id} {...thread} />;
  });
};

export default Comments;
