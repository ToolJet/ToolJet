import '@/_styles/editor/comment-notifications.scss';

import React from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import { commentsService } from '@/_services';

import TabContent from './Content';

import useRouter from '@/_hooks/use-router';

const CommentNotifications = ({ socket, toggleComments, appVersionsId }) => {
  const [unresolvedNotifications, setUnresolvedNotifications] = React.useState([]);
  const [resolvedNotifications, setResolvedNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [key, setKey] = React.useState('active');

  const router = useRouter();

  async function fetchData(k, both = false) {
    setLoading(true);
    if (both) {
      const [resolved, unresolved] = await Promise.all([
        commentsService.getNotifications(router.query.id, true, appVersionsId),
        commentsService.getNotifications(router.query.id, false, appVersionsId),
      ]);
      setResolvedNotifications(resolved.data);
      setUnresolvedNotifications(unresolved.data);
    } else {
      const isResolved = k === 'resolved';
      const data = (await commentsService.getNotifications(router.query.id, isResolved, appVersionsId))?.data;
      isResolved ? setResolvedNotifications(data) : setUnresolvedNotifications(data);
    }
    setLoading(false);
  }
  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    // Listen for messages. It is not possible to determine which notification collection
    // should be updated, so we just update both
    socket?.addEventListener('message', function (event) {
      if (event.data === 'notifications') fetchData(null, true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="comment-notification-sidebar editor-sidebar">
      <div className="card-header">
        <span className="comment-notification-header">Comments</span>
        <div className="ms-auto">
          <svg
            className="cursor-pointer"
            onClick={toggleComments}
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.64628 7.62107L11.6712 12.6474L12.647 11.673L7.62067 6.64669L12.647 1.62176L11.6726 0.645996L6.64628 5.6723L1.62136 0.645996L0.646973 1.62176L5.6719 6.64669L0.646973 11.6716L1.62136 12.6474L6.64628 7.62107Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
      <span className="border-bottom" />
      <Tabs
        activeKey={key}
        onSelect={async (k) => {
          setKey(k);
          setLoading(true);
          await fetchData(k);
          setLoading(false);
        }}
        className="dflex justify-content-center"
      >
        <Tab className="comment-notification-nav-item" eventKey="active" title="Active">
          <TabContent notifications={unresolvedNotifications} loading={loading} />
        </Tab>
        <Tab className="comment-notification-nav-item" eventKey="resolved" title="Resolved">
          <TabContent notifications={resolvedNotifications} loading={loading} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default CommentNotifications;
