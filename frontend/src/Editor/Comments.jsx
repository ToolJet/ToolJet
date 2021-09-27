import '@/_styles/editor/comments.scss';

import React from 'react';
import { isEmpty } from 'lodash';

import Comment from './Comment';
import { commentsService } from '@/_services';

const Comments = () => {
  const [commentPositions, setCommentPositions] = React.useState([]);

  React.useEffect(() => {
    async function fetchData() {
      const { data } = await commentsService.getPositions()
      setCommentPositions(data)
    }
    fetchData();
  }, [])

  if (isEmpty(commentPositions)) return null

  return (
    Object.keys(commentPositions).map((key) => {
      const { x, y } = commentPositions[key];
      return (
        <Comment commentId={key} x={x} y={y} />
      )
    })
  )
}

export default Comments;
