import React, { useState } from 'react';
import cx from 'classnames';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import { EditVersion } from './EditVersionModal';
import { CreateVersion } from './CreateVersionModal';
import { ConfirmDialog } from '@/_components';
import { ToolTip } from '@/_components/ToolTip';
import EditWhite from '@assets/images/icons/edit-white.svg';
import { defaultAppEnvironments } from '@/_helpers/utils';

const Menu = (props) => {
  const { currentEnvironment } = props;
  const isEnvDevelopment = currentEnvironment?.name === 'development';
  return (
    <components.Menu {...props}>
      <div>
        <div
          className="cursor-pointer"
          style={{ padding: '8px 12px' }}
          onClick={() => !props?.selectProps?.value?.isReleasedVersion && props.selectProps.setShowEditAppVersion(true)}
        >
          <div className="row" style={{ padding: '8px 12px' }}>
            <div className="col-10 text-truncate tj-text-xsm color-slate12" data-cy="current-version">
              {props?.selectProps?.value?.appVersionName}
            </div>
            {!props?.selectProps?.value?.isReleasedVersion && (
              <div className="col-1">
                <EditWhite />
              </div>
            )}
          </div>
        </div>
        <hr className="m-0" />
        <div>{props.children}</div>
        <ToolTip message="New versions can only be created in development" show={!isEnvDevelopment} placement="right">
          <div
            className="cursor-pointer tj-text-xsm"
            style={{
              padding: '8px 12px',
              color: `${isEnvDevelopment ? '#3E63DD' : '#C1C8CD'}`,
              cursor: `${isEnvDevelopment ? 'pointer' : 'none'}`,
            }}
            onClick={() => isEnvDevelopment && props.selectProps.setShowCreateAppVersion(true)}
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
              <rect width="34" height="34" rx="6" fill="#F1F3F5" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17 11C17.4142 11 17.75 11.3358 17.75 11.75V16.25H22.25C22.6642 16.25 23 16.5858 23 17C23 17.4142 22.6642 17.75 22.25 17.75H17.75V22.25C17.75 22.6642 17.4142 23 17 23C16.5858 23 16.25 22.6642 16.25 22.25V17.75H11.75C11.3358 17.75 11 17.4142 11 17C11 16.5858 11.3358 16.25 11.75 16.25H16.25V11.75C16.25 11.3358 16.5858 11 17 11Z"
                fill={`${isEnvDevelopment ? '#3E63DD' : '#C1C8CD'}`}
              />
            </svg>
            Create new version
          </div>
        </ToolTip>
      </div>
    </components.Menu>
  );
};

const SingleValue = ({ selectProps }) => {
  return (
    <div className="d-inline-flex align-items-center" data-cy="app-version-label" style={{ gap: '8px' }}>
      <div className="d-inline-flex align-items-center" style={{ gap: '2px' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g id="layers">
            <g id="Union">
              <path
                d="M6.28275 1.32756C6.73436 1.10175 7.26594 1.10175 7.71756 1.32756L11.9856 3.4616C12.738 3.8378 12.738 4.91152 11.9856 5.28772L7.71756 7.42177C7.26594 7.64758 6.73436 7.64758 6.28275 7.42177L2.01466 5.28772C1.26226 4.91152 1.26226 3.8378 2.01466 3.4616L6.28275 1.32756Z"
                fill="#D6409F"
              />
              <path
                d="M1.35032 10.0303C1.44845 9.80947 1.707 9.71003 1.92779 9.80816L6.70397 11.9309C6.8925 12.0147 7.10771 12.0147 7.29625 11.9309L12.0724 9.80816C12.2932 9.71003 12.5518 9.80947 12.6499 10.0303C12.748 10.2511 12.6486 10.5096 12.4278 10.6077L7.65162 12.7305C7.23684 12.9148 6.76338 12.9148 6.34859 12.7305L1.57242 10.6077C1.35162 10.5096 1.25218 10.2511 1.35032 10.0303Z"
                fill="#D6409F"
              />
              <path
                d="M1.92779 7.18316C1.707 7.08503 1.44845 7.18447 1.35032 7.40527C1.25218 7.62607 1.35162 7.88461 1.57242 7.98275L6.34859 10.1055C6.76338 10.2898 7.23684 10.2898 7.65162 10.1055L12.4278 7.98275C12.6486 7.88461 12.748 7.62607 12.6499 7.40527C12.5518 7.18447 12.2932 7.08503 12.0724 7.18316L7.29625 9.3059C7.10771 9.3897 6.8925 9.3897 6.70397 9.3059L1.92779 7.18316Z"
                fill="#D6409F"
              />
            </g>
          </g>
        </svg>
        <p className="tj-app-version-text tj-text-xsm"> ver</p>
      </div>
      <div
        className={cx('app-version-name text-truncate', { 'color-light-green': selectProps.value.isReleasedVersion })}
        data-cy={`${selectProps.value?.appVersionName}-current-version-text`}
      >
        {selectProps.value?.appVersionName}
      </div>
    </div>
  );
};

export const CustomSelect = ({ currentEnvironment, onSelectVersion, ...props }) => {
  const [showEditAppVersion, setShowEditAppVersion] = useState(false);
  const [showCreateAppVersion, setShowCreateAppVersion] = useState(false);

  const { deleteVersion, deleteAppVersion, resetDeleteModal } = props;

  return (
    <>
      <CreateVersion
        {...props}
        showCreateAppVersion={showCreateAppVersion}
        setShowCreateAppVersion={setShowCreateAppVersion}
        onSelectVersion={onSelectVersion}
      />
      <EditVersion
        {...props}
        showEditAppVersion={showEditAppVersion}
        setShowEditAppVersion={setShowEditAppVersion}
        currentEnvironment={currentEnvironment}
      />
      {/* TODO[future]:: use environments list instead of hard coded defaultAppEnvironments data */}
      <ConfirmDialog
        show={deleteVersion.showModal}
        message={`${
          defaultAppEnvironments.length > 1
            ? 'Deleting a version will permanently remove it from all environments.'
            : ''
        }Are you sure you want to delete this version - ${deleteVersion.versionName}?`}
        onConfirm={() => deleteAppVersion(deleteVersion.versionId, deleteVersion.versionName)}
        onCancel={resetDeleteModal}
      />
      <Select
        width={'100%'}
        data-cy={`test-version-selector`}
        hasSearch={false}
        components={{ Menu: (props) => <Menu {...props} currentEnvironment={currentEnvironment} />, SingleValue }}
        setShowEditAppVersion={setShowEditAppVersion}
        setShowCreateAppVersion={setShowCreateAppVersion}
        styles={{ border: 0 }}
        {...props}
      />
    </>
  );
};
