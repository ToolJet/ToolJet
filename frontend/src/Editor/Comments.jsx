import '@/_styles/editor/comments.scss';

import React from 'react';
import { isEmpty } from 'lodash';

import Comment from './Comment';
import { commentsService } from '@/_services';

import useRouter from '@/_hooks/use-router';

const Comments = ({ newThread = {}, appVersionsId, socket }) => {
  const [threads, setThreads] = React.useState([]);
  const router = useRouter();

  async function fetchData() {
    const { data } = await commentsService.getThreads(router.query.id, appVersionsId);
    setThreads(data);
  }

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    // Listen for messages
    socket?.addEventListener('message', function (event) {
      if (event.data === 'threads') fetchData();
    });
  }, []);

  React.useEffect(() => {
    !isEmpty(newThread) && setThreads([...threads, newThread]);
  }, [newThread]);

  if (isEmpty(threads)) return null;

  return threads.map((thread) => {
    const { id } = thread;
    return (
      <Comment
        key={id}
        appVersionsId={appVersionsId}
        fetchThreads={fetchData}
        socket={socket}
        threadId={id}
        {...thread}
      />
    );
  });
};

export default Comments;
