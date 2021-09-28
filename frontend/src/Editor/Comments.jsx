import '@/_styles/editor/comments.scss';

import React from 'react';
import { isEmpty } from 'lodash';

import Comment from './Comment';
import { commentsService } from '@/_services';

const Comments = ({ reload }) => {
  const [threads, setThreads] = React.useState([]);
  async function fetchData() {
    const { data } = await commentsService.getThreads()
    setThreads(data)
  }
  React.useEffect(() => {
    fetchData();
  }, [])
  React.useEffect(() => {
    fetchData();
  }, [reload])

  if (isEmpty(threads)) return null

  return (
    threads.map((thread) => {
      const { id, x, y } = thread;
      return (
        <Comment threadId={id} x={x} y={y} />
      )
    })
  )
}

export default Comments;
