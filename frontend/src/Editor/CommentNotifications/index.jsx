import '@/_styles/editor/comment-notifications.scss';
import cx from 'classnames';
import React from 'react';
import { commentsService } from '@/_services';
import TabContent from './Content';
import useRouter from '@/_hooks/use-router';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

const CommentNotifications = ({ socket, toggleComments, pageId }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { appVersionsId } = useAppVersionStore(
    (state) => ({
      appVersionsId: state?.editingVersion?.id,
    }),
    shallow
  );
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [key, setKey] = React.useState('active');

  const router = useRouter();

  async function fetchData(selectedKey) {
    const isResolved = selectedKey === 'resolved';
    setLoading(true);
    const { data } = await commentsService.getNotifications(router.query.id, isResolved, appVersionsId, pageId);
    setLoading(false);
    setNotifications(data);
  }

  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    socket?.addEventListener('message', function (event) {
      if (event.data === 'notifications') fetchData(key);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = async (selectedKey) => {
    setLoading(true);
    await fetchData(selectedKey);
    setLoading(false);
    setKey(selectedKey);
  };

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
      <div style={{ padding: '16px 8px', borderRadius: 6 }}>
        <div
          className="d-flex p-1"
          style={{ background: darkMode ? '#2F3C4C' : '#ECEEF0' }}
          role="tablist"
          aria-orientation="horizontal"
        >
          <button
            className={cx('btn w-50 comment-notification-nav-item', {
              'bg-white': key === 'active' && !darkMode,
              'bg-black': key === 'active' && darkMode,
              'color-white': key === 'active' && darkMode,
              'opacity-100': key === 'active',
            })}
            role="tab"
            type="button"
            aria-selected="true"
            tabIndex="0"
            onClick={() => handleClick('active')}
          >
            Active
          </button>
          <button
            className={cx('btn w-50 comment-notification-nav-item', {
              'bg-white': key === 'resolved' && !darkMode,
              'bg-black': key === 'resolved' && darkMode,
              'color-white': key === 'resolved' && darkMode,
              'opacity-100': key === 'resolved',
            })}
            role="tab"
            type="button"
            aria-selected="false"
            tabIndex="-1"
            onClick={() => handleClick('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>
      <TabContent notifications={notifications} loading={loading} darkMode={darkMode} />
    </div>
  );
};

export default CommentNotifications;
