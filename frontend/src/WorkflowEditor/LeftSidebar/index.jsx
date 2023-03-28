import '@/_styles/left-sidebar.scss';
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';

import { DarkMode } from '../../_components/DarkModeToggle';
import useRouter from '../../_hooks/use-router';
import { ConfirmDialog } from '@/_components';
import config from 'config';
import { getSvgIcon } from '@/_helpers/appUtils';

export const LeftSidebar = forwardRef((props, ref) => {
  const router = useRouter();
  const { appId, switchDarkMode, darkMode = false, appVersionsId, queryPanelHeight } = props;
  const [selectedSidebarItem, setSelectedSidebarItem] = useState();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);
  const [popoverContentHeight, setPopoverContentHeight] = useState(queryPanelHeight);
  useEffect(() => {
    popoverContentHeight !== queryPanelHeight && setPopoverContentHeight(queryPanelHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPanelHeight]);

  useImperativeHandle(ref, () => ({
    dataSourceModalToggleStateHandler() {
      toggleDataSourceManagerModal(true);
    },
  }));

  const handleSelectedSidebarItem = (item) => {
    if (item === selectedSidebarItem) {
      setSelectedSidebarItem(null);
    } else {
      setSelectedSidebarItem(item);
    }
  };

  return (
    <div className="left-sidebar" data-cy="left-sidebar-inspector">
      <div className="w-90"></div>
    </div>
  );
});
