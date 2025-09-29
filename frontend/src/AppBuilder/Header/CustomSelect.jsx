import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import { EditVersionModal } from './EditVersionModal';
import { ConfirmDialog } from '@/_components';
import { ToolTip } from '@/_components/ToolTip';
import EditWhite from '@assets/images/icons/edit-white.svg';
import { defaultAppEnvironments, decodeEntities } from '@/_helpers/utils';
import { CreateVersionModal } from '@/modules/Appbuilder/components';
import useStore from '@/AppBuilder/_stores/store';

import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';

// TODO: edit version modal and add version modal
const Menu = (props) => {
  const isEditable = props.selectProps.isEditable;
  const creationMode = props?.selectProps?.appCreationMode;
  const allowAppEdit = useStore((state) => state.allowEditing);
  const [isVersionCreationEnabled, setIsVersionCreationEnabled] = useState(
    creationMode !== 'GIT' || (creationMode === 'GIT' && allowAppEdit)
  );
  useEffect(() => {
    setIsVersionCreationEnabled(creationMode !== 'GIT' || (creationMode === 'GIT' && allowAppEdit));
  }, [allowAppEdit, creationMode]);

  return (
    <components.Menu {...props}>
      <div>
        {isEditable && !props?.selectProps?.value?.isReleasedVersion && (
          <ToolTip
            message="New versions cannot be created for non-editable apps"
            show={!isVersionCreationEnabled}
            placement="right"
          >
            <div
              className="cursor-pointer"
              style={{ padding: '8px 12px' }}
              onClick={() =>
                !props?.selectProps?.value?.isReleasedVersion &&
                isVersionCreationEnabled &&
                props.selectProps.setShowEditAppVersion(true)
              }
            >
              <div className="row" style={{ padding: '8px 12px' }}>
                <div className="col-10 text-truncate tj-text-xsm color-slate12" data-cy="current-version">
                  {props?.selectProps?.value?.appVersionName &&
                    decodeEntities(props?.selectProps?.value?.appVersionName)}
                </div>
                <div className={cx('col-1', { 'disabled-action-tooltip': !isVersionCreationEnabled })}>
                  <EditWhite />
                </div>
              </div>
            </div>
          </ToolTip>
        )}
        <hr className="m-0" />
        <div>{props.children}</div>
        {isEditable && (
          <ToolTip
            message={'New versions cannot be created for non-editable apps'}
            show={!isVersionCreationEnabled}
            placement="right"
          >
            <div
              className="cursor-pointer tj-text-xsm"
              style={{
                padding: '8px 12px',
                color: `${isVersionCreationEnabled ? '#3E63DD' : '#C1C8CD'}`,
                cursor: `${isVersionCreationEnabled ? 'pointer' : 'none'}`,
              }}
              onClick={() => isVersionCreationEnabled && props?.setShowCreateAppVersion(true)}
              data-cy="create-new-version-button"
            >
              <svg
                className="icon me-1"
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
              Create new version
            </div>
          </ToolTip>
        )}
      </div>
    </components.Menu>
  );
};

export const SingleValue = ({ selectProps }) => {
  const appVersionName = selectProps.value?.appVersionName;
  const { menuIsOpen } = selectProps;
  return (
    <div className="d-inline-flex align-items-center tw-w-full" data-cy="app-version-label" style={{ gap: '8px' }}>
      <Button variant="ghost" className={`tw-w-full tw-min-w-[80px] ${menuIsOpen ? 'tw-bg-button-outline-hover' : ''}`}>
        <Tag width="16" height="16" className="tw-text-icon-success" />

        <span
          className={cx('app-version-name text-truncate', { 'color-light-green': selectProps.value.isReleasedVersion })}
          data-cy={`${appVersionName}-current-version-text`}
        >
          {appVersionName && decodeEntities(appVersionName)}
        </span>
      </Button>
    </div>
  );
};

export const CustomSelect = ({ currentEnvironment, onSelectVersion, ...props }) => {
  const [showEditAppVersion, setShowEditAppVersion] = useState(false);
  const [showCreateAppVersion, setShowCreateAppVersion] = useState(false);

  const { deleteVersion, deleteAppVersion, resetDeleteModal, isEditable } = props;
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
          currentEnvironment={currentEnvironment}
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
      <Select
        width={'100%'}
        data-cy={`test-version-selector`}
        hasSearch={false}
        components={{
          Menu: (props) => (
            <Menu
              {...props}
              className="!tw-w-44"
              currentEnvironment={currentEnvironment}
              setShowCreateAppVersion={setShowCreateAppVersion}
            />
          ),
          SingleValue,
        }}
        setShowEditAppVersion={setShowEditAppVersion}
        setShowCreateAppVersion={setShowCreateAppVersion}
        styles={{ border: 0 }}
        {...props}
      />
    </>
  );
};
