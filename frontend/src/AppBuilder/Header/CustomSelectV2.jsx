import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import { SelectV2 } from '@/_ui/Select';
import { EditVersionModal } from './EditVersionModal';
import { ConfirmDialog } from '@/_components';
import { ToolTip } from '@/_components/ToolTip';
import EditWhite from '@assets/images/icons/edit-white.svg';
import { defaultAppEnvironments, decodeEntities } from '@/_helpers/utils';
import { CreateVersionModal } from '@/modules/Appbuilder/components';
import useStore from '@/AppBuilder/_stores/store';

import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import './VersionManagementDropDown/styles/version-management-dropdown.scss';

// Refactored Menu component with separate divs for each section
const Menu = (props) => {
  const isEditable = props.selectProps.isEditable;
  const creationMode = props?.selectProps?.appCreationMode;
  const allowAppEdit = useStore((state) => state.allowEditing);
  const [isVersionCreationEnabled, setIsVersionCreationEnabled] = useState(
    creationMode !== 'GIT' || (creationMode === 'GIT' && allowAppEdit)
  );
  const currentEnvironment = props.selectProps.value?.currentEnvironment || 'production';

  useEffect(() => {
    setIsVersionCreationEnabled(creationMode !== 'GIT' || (creationMode === 'GIT' && allowAppEdit));
  }, [allowAppEdit, creationMode]);

  return (
    <div className="version-management-dropdown-menu">
      {/* Environment Selection Section */}
      <div className="environment-selector-section">
        <div className="environment-selector">
          <div className="environment-items-container">
            {defaultAppEnvironments.map((env) => (
              <div
                key={env.name}
                className={cx('environment-item', 'tj-text-xsm', {
                  'active-environment': currentEnvironment === env.name,
                })}
                onClick={() => {
                  // Handle environment selection here
                  if (props.selectProps.onEnvironmentChange) {
                    props.selectProps.onEnvironmentChange(env.name);
                  }
                }}
                data-cy={`environment-${env.name}`}
              >
                <span className="environment-name">{env.name.charAt(0).toUpperCase() + env.name.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <hr className="section-divider" />

      {/* Options List Section */}
      <div className="options-section">{props.children}</div>

      {/* Create New Version Section */}
      {isEditable && (
        <div className="create-version-section">
          <ToolTip
            message={'New versions cannot be created for non-editable apps'}
            show={!isVersionCreationEnabled}
            placement="right"
          >
            <div
              className={cx('create-version-container', 'tj-text-xsm', {
                enabled: isVersionCreationEnabled,
                disabled: !isVersionCreationEnabled,
              })}
              onClick={() => isVersionCreationEnabled && props?.setShowCreateAppVersion(true)}
              data-cy="create-new-version-button"
            >
              <svg
                className="add-icon"
                width="34"
                height="34"
                viewBox="0 0 34 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="34" height="34" rx="6" fill="var(--indigo3)" />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M17 11C17.4142 11 17.75 11.3358 17.75 11.75V16.25H22.25C22.6642 16.25 23 16.5858 23 17C23 17.4142 22.6642 17.75 22.25 17.75H17.75V22.25C17.75 22.6642 17.4142 23 17 23C16.5858 23 16.25 22.6642 16.25 22.25V17.75H11.75C11.3358 17.75 11 17.4142 11 17C11 16.5858 11.3358 16.25 11.75 16.25H16.25V11.75C16.25 11.3358 16.5858 11 17 11Z"
                  fill={`${isVersionCreationEnabled ? '#3E63DD' : '#C1C8CD'}`}
                />
              </svg>
              <span className="create-version-text">Create new version</span>
            </div>
          </ToolTip>
        </div>
      )}
    </div>
  );
};

export const SingleValue = ({ selectProps = {} }) => {
  const appVersionName = selectProps.value?.appVersionName;
  const { menuIsOpen, onToggleMenu } = selectProps;
  return (
    <div className="single-value-container" data-cy="app-version-label">
      <Button
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleMenu && typeof onToggleMenu === 'function') {
            onToggleMenu();
          }
        }}
        variant="ghost"
        className={`single-value-button ${menuIsOpen ? 'tw-bg-button-outline-hover' : ''}`}
      >
        <Tag width="16" height="16" className="tw-text-icon-success" />

        <span
          className={cx('app-version-name text-truncate', {
            'color-light-green': selectProps.value.isReleasedVersion,
          })}
          data-cy={`${appVersionName}-current-version-text`}
        >
          {appVersionName && decodeEntities(appVersionName)}
        </span>
      </Button>
    </div>
  );
};

export const CustomSelectV2 = ({ currentEnvironment, onSelectVersion, ...props }) => {
  const [showEditAppVersion, setShowEditAppVersion] = useState(false);
  const [showCreateAppVersion, setShowCreateAppVersion] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState(currentEnvironment || 'production');

  const { deleteVersion, deleteAppVersion, resetDeleteModal, isEditable } = props;

  const handleEnvironmentChange = (environment) => {
    setSelectedEnvironment(environment);
    // Call parent handler if available
    if (props.onEnvironmentChange) {
      props.onEnvironmentChange(environment);
    }
  };

  return (
    <>
      {isEditable && showCreateAppVersion && (
        <CreateVersionModal
          {...props}
          showCreateAppVersion={showCreateAppVersion}
          setShowCreateAppVersion={setShowCreateAppVersion}
          onSelectVersion={onSelectVersion}
        />
      )}

      {isEditable && (
        <EditVersionModal
          {...props}
          showEditAppVersion={showEditAppVersion}
          setShowEditAppVersion={setShowEditAppVersion}
          currentEnvironment={selectedEnvironment}
        />
      )}

      {/* TODO[future]:: use environments list instead of hard coded defaultAppEnvironments data */}
      {/*  When we merge this code to EE update the defaultAppEnvironments object with rest of default environments (then delete this comment)*/}
      <ConfirmDialog
        show={deleteVersion.showModal}
        message={`Are you sure you want to delete this version - ${decodeEntities(deleteVersion.versionName)}?`}
        onConfirm={() => deleteAppVersion(deleteVersion.versionId, deleteVersion.versionName)}
        onCancel={resetDeleteModal}
      />
      <SelectV2
        width={'100%'}
        data-cy={`test-version-selector`}
        hasSearch={false}
        components={{
          Menu: (props) => (
            <Menu
              {...props}
              className="!tw-w-80"
              currentEnvironment={selectedEnvironment}
              setShowCreateAppVersion={setShowCreateAppVersion}
            />
          ),
          SingleValue,
        }}
        setShowEditAppVersion={setShowEditAppVersion}
        setShowCreateAppVersion={setShowCreateAppVersion}
        styles={{ border: 0 }}
        onEnvironmentChange={handleEnvironmentChange}
        value={{
          ...props.value,
          currentEnvironment: selectedEnvironment,
        }}
        {...props}
      />
    </>
  );
};
