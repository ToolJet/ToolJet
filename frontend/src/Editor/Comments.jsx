import '@/_styles/editor/comments.scss';
import { shallow } from 'zustand/shallow';
import React from 'react';
import { isEmpty } from 'lodash';
import Comment from './Comment';
import { commentsService } from '@/_services';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useAppDataStore } from '@/_stores/appDataStore';

const Comments = ({ newThread = {}, socket, canvasWidth, currentPageId }) => {
  const [threads, setThreads] = React.useState([]);
  const { appVersionsId } = useAppVersionStore((state) => ({ appVersionsId: state?.editingVersion?.id }), shallow);
  const { appId } = useAppDataStore(
    (state) => ({
      appId: state?.appId,
    }),
    shallow
  );

  async function fetchData() {
    const { data } = await commentsService.getThreads(appId, appVersionsId);
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

  return threads
    .filter((thread) => thread.pageId === currentPageId)
    .map((thread) => {
      const { id } = thread;
      return (
        <Comment
          key={id}
          appVersionsId={appVersionsId}
          fetchThreads={fetchData}
          socket={socket}
          threadId={id}
          canvasWidth={canvasWidth}
          appId={appId}
          {...thread}
        />
      );
    });
};

export default Comments;
