import React, { useCallback } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import useStore from '@/AppBuilder/_stores/store';
import classNames from 'classnames';
import Edit from '@/_ui/Icon/bulkIcons/Edit';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import Copy from '@/_ui/Icon/solidIcons/Copy';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { shallow } from 'zustand/shallow';
import { ToolTip } from '@/_components/ToolTip';
import { debounce } from 'lodash';
import usePopoverObserver from '@/AppBuilder/_hooks/usePopoverObserver';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const QueryCardMenu = ({ darkMode }) => {
  const { moduleId } = useModuleContext();
  const appId = useStore((state) => state.appStore.modules[moduleId].app.appId);
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const toggleQueryPermissionModal = useStore((state) => state.queryPanel.toggleQueryPermissionModal);
  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
  const targetBtnForMenu = useStore((state) => state.queryPanel.targetBtnForMenu);
  const targetElement = document.getElementById(targetBtnForMenu);
  const showQueryHandlerMenu = useStore((state) => state.queryPanel.showQueryHandlerMenu);
  const toggleQueryHandlerMenu = useStore((state) => state.queryPanel.toggleQueryHandlerMenu);
  const duplicateQuery = useStore((state) => state.dataQuery.duplicateQuery);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData);
  const setRenamingQuery = useStore((state) => state.queryPanel.setRenamingQuery);
  const deleteDataQuery = useStore((state) => state.queryPanel.deleteDataQuery);

  const QUERY_MENU_OPTIONS = [
    {
      label: 'Rename',
      value: 'rename',
      icon: <Edit width={16} />,
      showTooltip: false,
    },
    {
      label: 'Duplicate',
      value: 'duplicate',
      icon: <Copy width={16} />,
      showTooltip: false,
    },
    {
      label: 'Query permission',
      value: 'permission',
      icon: (
        <img
          alt="permission-icon"
          src="assets/images/icons/editor/left-sidebar/authorization.svg"
          width="16"
          height="16"
        />
      ),
      trailingIcon: <SolidIcon width={16} name="enterprisecrown" className="mx-1" />,
    },
    {
      label: 'Delete',
      value: 'delete',
      icon: <Trash width={16} fill={'#E54D2E'} />,
      showTooltip: false,
    },
  ];

  // To prevent user clicking from continuous clicks
  const debouncedDuplicateQuery = useCallback(
    debounce((queryId, appId) => {
      duplicateQuery(queryId, appId);
      setPreviewData(null);
    }, 500),
    [duplicateQuery]
  );

  const handleQueryMenuActions = (value) => {
    if (value === 'rename') {
      setRenamingQuery(selectedQuery?.id);
    }
    if (value === 'duplicate') {
      debouncedDuplicateQuery(selectedQuery?.id, appId);
    }
    if (value === 'permission') {
      if (!licenseValid) return;
      toggleQueryPermissionModal(true);
    }
    if (value === 'delete') {
      deleteDataQuery(selectedQuery?.id);
    }
    toggleQueryHandlerMenu(false);
  };

  usePopoverObserver(
    document.getElementsByClassName('query-list')[0],
    targetElement,
    document.getElementById('query-list-menu'),
    showQueryHandlerMenu,
    () => (document.getElementById('query-list-menu').style.display = 'block'),
    () => (document.getElementById('query-list-menu').style.display = 'none')
  );

  return (
    <Overlay
      placement="bottom-start"
      target={targetElement}
      show={showQueryHandlerMenu}
      rootClose
      onHide={() => toggleQueryHandlerMenu(false)}
      popperConfig={{
        strategy: 'absolute',
        modifiers: [
          {
            name: 'flip',
            enabled: true,
            options: {
              fallbackPlacements: ['top-start', 'top-end', 'bottom-start', 'bottom-end', 'left-start', 'right-start'],
              boundary: 'viewport',
            },
          },
          {
            name: 'preventOverflow',
            enabled: true,
            options: {
              boundary: 'viewport',
              rootBoundary: 'viewport',
              padding: 8,
              altAxis: true,
              altBoundary: true,
            },
          },
          {
            name: 'shift',
            enabled: true,
            options: {
              boundary: 'viewport',
              padding: 8,
            },
          },
          {
            name: 'offset',
            options: {
              offset: [0, 3],
            },
          },
        ],
      }}
    >
      {(props) => (
        <Popover {...props} id="query-list-menu" className={darkMode && 'dark-theme'}>
          <Popover.Body bsPrefix="list-item-popover-body">
            {QUERY_MENU_OPTIONS.map((option) => {
              const optionBody = (
                <div
                  data-cy={`component-inspector-${String(option?.value).toLowerCase()}-button`}
                  className="list-item-popover-option"
                  key={option?.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQueryMenuActions(option.value);
                  }}
                >
                  <div className="list-item-popover-menu-option-icon">{option.icon}</div>
                  <div
                    className={classNames('list-item-option-menu-label', {
                      'color-tomato9': option.value === 'delete',
                      'color-disabled': option.value === 'permission' && !licenseValid,
                    })}
                  >
                    {option?.label}
                  </div>
                  {option.value === 'permission' && !licenseValid && option.trailingIcon && option.trailingIcon}
                </div>
              );

              return option.value === 'permission' ? (
                <ToolTip
                  key={option.value}
                  message={'Component permissions are available only in paid plans'}
                  placement="left"
                  show={!licenseValid}
                >
                  {optionBody}
                </ToolTip>
              ) : (
                optionBody
              );
            })}
          </Popover.Body>
        </Popover>
      )}
    </Overlay>
  );
};

export default QueryCardMenu;
