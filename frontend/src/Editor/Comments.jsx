import '@/_styles/editor/comments.scss';

import React from 'react';
import { isEmpty, capitalize } from 'lodash';

import Comment from './Comment';
import { commentsService, organizationService } from '@/_services';

import useRouter from '@/_hooks/use-router';

const Comments = ({ newThread = {}, appVersionsId, socket, canvasWidth }) => {
  const [threads, setThreads] = React.useState([]);
  const router = useRouter();

  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    organizationService.getUsers(null).then((data) => {
      const _users = data.users.map((u) => ({
        id: u.id,
        display: `${capitalize(u.first_name)} ${capitalize(u.last_name)}`,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
      }));
      setUsers(_users);
    });
  }, []);

  async function fetchData() {
    const { data } = await commentsService.getThreads(router.query.id, appVersionsId);
    setThreads(data);
  }

  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    // Listen for messages
    socket?.addEventListener('message', function (event) {
      if (event.data === 'threads') fetchData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    !isEmpty(newThread) && setThreads([...threads, newThread]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        canvasWidth={canvasWidth}
        users={users}
        {...thread}
      />
    );
  });
};

export default Comments;
