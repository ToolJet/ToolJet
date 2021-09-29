import '@/_styles/editor/comments.scss';

import React from 'react';
import { isEmpty } from 'lodash';

import Comment from './Comment';
import { commentsService } from '@/_services';

import useRouter from '@/_hooks/use-router';

const Comments = ({ reload }) => {
  const [threads, setThreads] = React.useState([]);
  const router = useRouter();
  async function fetchData() {
    const { data } = await commentsService.getThreads(router.query.id);
    setThreads(data);
  }
  React.useEffect(() => {
    fetchData();
  }, []);
  React.useEffect(() => {
    reload && fetchData();
  }, [reload]);

  if (isEmpty(threads)) return null;

  return threads.map((thread) => {
    const { id, x, y } = thread;
    return <Comment key={id} threadId={id} x={x} y={y} user={thread.user} />;
  });
};

export default Comments;
