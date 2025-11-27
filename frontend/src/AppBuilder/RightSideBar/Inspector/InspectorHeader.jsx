import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import classNames from 'classnames';
import Tabs from '@/ToolJetUI/Tabs/Tabs';
import Tab from '@/ToolJetUI/Tabs/Tab';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Edit from '@/_ui/Icon/bulkIcons/Edit';
import Copy from '@/_ui/Icon/solidIcons/Copy';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import Inspect from '@/_ui/Icon/solidIcons/Inspect';
import { ToolTip } from '@/_components/ToolTip';
import { Button } from '@/components/ui/Button/Button';
import AppPermissionsModal from '@/modules/Appbuilder/components/AppPermissionsModal';
import { appPermissionService } from '@/_services';
import { ModuleEditorBanner } from '@/modules/Modules/components';

const INSPECTOR_HEADER_OPTIONS = [
  {
    label: 'Inspect',
    value: 'inspect',
    icon: <Inspect width={16} />,
  },
  {
    label: 'Rename',
    value: 'rename',
    icon: <Edit width={16} />,
  },
  {
    label: 'Duplicate',
    value: 'duplicate',
    icon: <Copy width={16} />,
  },
  {
    label: 'Component permission',
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
  },
];

export const InspectorHeader = ({
  darkMode,
  activeTab,
  setActiveTab,
  showHeaderActionsMenu,
  setShowHeaderActionsMenu,
  isModuleContainer,
  selectedComponentId,
  allComponents,
  licenseValid,
  showComponentPermissionModal,
  toggleComponentPermissionModal,
  setComponentPermission,
  onAction,
  onClose,
  newComponentName,
  setNewComponentName,
  onNameChange,
  inputRef,
}) => {
  const renderAppNameInput = () => {
    if (isModuleContainer) {
      return <ModuleEditorBanner title="Module Container" customStyles={{ height: 28, width: 150, marginTop: 3 }} />;
    }

    return (
      <div className="input-icon">
        <input
          onChange={(e) => setNewComponentName(e.target.value)}
          type="text"
          onBlur={() => onNameChange(newComponentName)}
          className="w-100 inspector-edit-widget-name"
          value={newComponentName}
          ref={inputRef}
          data-cy="edit-widget-name"
        />
      </div>
    );
  };

  const closeIcon = () => {
    return (
      <Button
        iconOnly
        leadingIcon={'x'}
        onClick={onClose}
        variant="ghost"
        fill="var(--icon-strong,#6A727C)"
        size="medium"
        data-cy="inspector-close-button"
        isLucid={true}
      />
    );
  };

  const menuIcon = () => {
    return (
      <OverlayTrigger
        trigger={'click'}
        placement={'bottom-end'}
        rootClose={false}
        show={showHeaderActionsMenu}
        overlay={
          <Popover id="list-menu" className={darkMode && 'dark-theme'}>
            <Popover.Body bsPrefix="list-item-popover-body">
              {INSPECTOR_HEADER_OPTIONS.map((option) => {
                const optionBody = (
                  <div
                    data-cy={`component-inspector-${String(option?.value).toLowerCase()}-button`}
                    className="list-item-popover-option"
                    key={option?.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(option.value);
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
        }
      >
        <span className="cursor-pointer" onClick={() => setShowHeaderActionsMenu(true)}>
          <Button
            iconOnly
            leadingIcon={'more-vertical'}
            variant="ghost"
            fill="var(--icon-strong,#6A727C)"
            size="medium"
            data-cy="menu-icon"
            isLucid={true}
          />
        </span>
      </OverlayTrigger>
    );
  };

  return (
    <div className="inspector-header">
      {/* Row 1: Component Name + Menu + Close */}
      <div className="header-title-row">
        <div className="flex-grow-1">{renderAppNameInput()}</div>
        <div className="header-actions">
          {!isModuleContainer && (
            <>
              {menuIcon()}
              <AppPermissionsModal
                modalType="component"
                resourceId={selectedComponentId}
                resourceName={allComponents[selectedComponentId]?.component?.name}
                showModal={showComponentPermissionModal}
                toggleModal={toggleComponentPermissionModal}
                darkMode={darkMode}
                fetchPermission={(id, appId) => appPermissionService.getComponentPermission(appId, id)}
                createPermission={(id, appId, body) => appPermissionService.createComponentPermission(appId, id, body)}
                updatePermission={(id, appId, body) => appPermissionService.updateComponentPermission(appId, id, body)}
                deletePermission={(id, appId) => appPermissionService.deleteComponentPermission(appId, id)}
                onSuccess={(data) => setComponentPermission(selectedComponentId, data)}
              />
            </>
          )}
          {closeIcon()}
        </div>
      </div>

      {/* Row 2: Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => {
          setActiveTab(key);
        }}
        id="inspector-tabs"
        darkMode={darkMode}
        hidden={isModuleContainer}
      >
        <Tab eventKey="properties" title="Properties" />
        <Tab eventKey="styles" title="Styles" />
      </Tabs>
    </div>
  );
};
