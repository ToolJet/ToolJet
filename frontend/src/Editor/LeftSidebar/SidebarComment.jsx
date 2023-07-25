import React, { forwardRef } from 'react';
import cx from 'classnames';
import { LeftSidebarItem } from './SidebarItem';
import { commentsService } from '@/_services';
import useRouter from '@/_hooks/use-router';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';

export const LeftSidebarComment = forwardRef(({ selectedSidebarItem, currentPageId }, ref) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { appVersionsId } = useAppVersionStore(
    (state) => ({
      appVersionsId: state?.editingVersion?.id,
    }),
    shallow
  );
  const { toggleComments } = useEditorStore(
    (state) => ({
      toggleComments: state?.actions.toggleComments,
    }),
    shallow
  );
  const [isActive, toggleActive] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const router = useRouter();

  React.useEffect(() => {
    if (appVersionsId) {
      commentsService.getNotifications(router.query.id, false, appVersionsId, currentPageId).then(({ data }) => {
        setNotifications(data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appVersionsId, currentPageId]);
  return (
    <LeftSidebarItem
      commentBadge={notifications?.length > 0}
      selectedSidebarItem={selectedSidebarItem}
      title={appVersionsId ? 'toggle comments' : 'Comments section will be available once you save this application'}
      icon={darkMode ? `comments-dark` : 'comments-light'}
      className={cx(`left-sidebar-item left-sidebar-layout sidebar-comments`, {
        disabled: !appVersionsId,
        active: isActive,
        dark: darkMode,
      })}
      onClick={() => {
        toggleActive(!isActive);
        toggleComments();
      }}
      tip="Comments"
      ref={ref}
    />
  );
});
