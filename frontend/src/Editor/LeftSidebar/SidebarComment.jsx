import React from 'react';
import cx from 'classnames';
import { LeftSidebarItem } from './SidebarItem';
import { commentsService } from '@/_services';
import useRouter from '@/_hooks/use-router';

export const LeftSidebarComment = ({ toggleComments, appVersionsId }) => {
  const [isActive, toggleActive] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const router = useRouter();

  React.useEffect(() => {
    if (appVersionsId) {
      commentsService.getNotifications(router.query.id, false, appVersionsId).then(({ data }) => {
        setNotifications(data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appVersionsId]);

  return (
    <LeftSidebarItem
      commentBadge={notifications?.length > 0}
      tip={appVersionsId ? 'toggle comments' : 'Comments section will be available once you save this application'}
      icon={`comments`}
      className={cx(`left-sidebar-item sidebar-zoom left-sidebar-layout position-relative sidebar-comments`, {
        disabled: !appVersionsId,
        active: isActive,
      })}
      text={'Comments'}
      onClick={() => {
        toggleActive(!isActive);
        toggleComments();
      }}
    />
  );
};
