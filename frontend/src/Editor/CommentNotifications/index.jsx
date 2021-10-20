import '@/_styles/editor/comment-notifications.scss';

import React from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import { commentsService } from '@/_services';

import TabContent from './Content';

import useRouter from '@/_hooks/use-router';

const CommentNotifications = ({ toggleComments, currentVersionId }) => {
  const [notifications, setNotifications] = React.useState([]);
  const [key, setKey] = React.useState('active');

  const router = useRouter();

  async function fetchData(k) {
    const isResolved = k === 'resolved';
    const { data } = await commentsService.getNotifications(router.query.id, isResolved, currentVersionId);
    setNotifications(data);
  }
  React.useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="editor-sidebar">
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
              fill="black"
            />
          </svg>
        </div>
      </div>
      <span className="border-bottom" />
      <Tabs
        activeKey={key}
        onSelect={(k) => {
          setKey(k);
          fetchData(k);
        }}
        className="dflex justify-content-center"
      >
        <Tab className="comment-notification-nav-item" eventKey="active" title="Active">
          <TabContent notifications={notifications} />
        </Tab>
        <Tab className="comment-notification-nav-item" eventKey="resolved" title="Resolved">
          <TabContent notifications={notifications} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default CommentNotifications;
