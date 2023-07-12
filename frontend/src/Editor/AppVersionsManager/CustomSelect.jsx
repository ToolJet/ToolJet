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
          <div className="row">
            <div className="col-10 text-truncate">{props?.selectProps?.value?.appVersionName}</div>
            {!props?.selectProps?.value?.isReleasedVersion && (
              <div className="col-1">
                <EditWhite />
              </div>
            )}
          </div>
        </div>
        <hr className="m-0" />
        <div>{props.children}</div>
        <ToolTip
          message="New versions can only
be created in development"
          show={!isEnvDevelopment}
          placement="right"
        >
          <div
            className="cursor-pointer"
            style={{
              padding: '8px 12px',
              color: `${isEnvDevelopment ? '#3E63DD' : '#C1C8CD'}`,
              cursor: `${isEnvDevelopment ? 'pointer' : 'none'}`,
            }}
            onClick={() => isEnvDevelopment && props.selectProps.setShowCreateAppVersion(true)}
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
    <div className="d-inline-flex align-items-center" data-cy="app-version-label">
      <svg className="me-2" width="35" height="21" viewBox="0 0 35 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.44531 6.13737C4.12315 6.13737 3.86198 6.39854 3.86198 6.7207C3.86198 7.04287 4.12315 7.30404 4.44531 7.30404C4.76748 7.30404 5.02865 7.04287 5.02865 6.7207C5.02865 6.39854 4.76748 6.13737 4.44531 6.13737ZM2.69531 6.7207C2.69531 5.7542 3.47881 4.9707 4.44531 4.9707C5.41181 4.9707 6.19531 5.7542 6.19531 6.7207C6.19531 7.48266 5.70834 8.13089 5.02865 8.37112V12.0703C5.52589 12.246 5.91998 12.6401 6.09573 13.1374H9.11198C9.26669 13.1374 9.41506 13.0759 9.52446 12.9665C9.63385 12.8571 9.69531 12.7087 9.69531 12.554V11.0457L8.94112 11.7998C8.71332 12.0277 8.34397 12.0277 8.11617 11.7998C7.88836 11.572 7.88836 11.2027 8.11617 10.9749L9.86617 9.22489C10.094 8.99709 10.4633 8.99709 10.6911 9.22489L12.4411 10.9749C12.6689 11.2027 12.6689 11.572 12.4411 11.7998C12.2133 12.0277 11.844 12.0277 11.6162 11.7998L10.862 11.0457V12.554C10.862 13.0182 10.6776 13.4633 10.3494 13.7915C10.0212 14.1197 9.57611 14.304 9.11198 14.304H6.09573C5.8555 14.9837 5.20727 15.4707 4.44531 15.4707C3.47881 15.4707 2.69531 14.6872 2.69531 13.7207C2.69531 12.9587 3.18228 12.3105 3.86198 12.0703V8.37112C3.18228 8.13089 2.69531 7.48266 2.69531 6.7207ZM10.2786 6.13737C9.95648 6.13737 9.69531 6.39854 9.69531 6.7207C9.69531 7.04287 9.95648 7.30404 10.2786 7.30404C10.6008 7.30404 10.862 7.04287 10.862 6.7207C10.862 6.39854 10.6008 6.13737 10.2786 6.13737ZM8.52865 6.7207C8.52865 5.7542 9.31215 4.9707 10.2786 4.9707C11.2451 4.9707 12.0286 5.7542 12.0286 6.7207C12.0286 7.6872 11.2451 8.4707 10.2786 8.4707C9.31215 8.4707 8.52865 7.6872 8.52865 6.7207ZM4.44531 13.1374C4.12315 13.1374 3.86198 13.3985 3.86198 13.7207C3.86198 14.0429 4.12315 14.304 4.44531 14.304C4.76748 14.304 5.02865 14.0429 5.02865 13.7207C5.02865 13.3985 4.76748 13.1374 4.44531 13.1374Z"
          fill="#E93D82"
        />
        <path
          d="M20.1074 12.9258L22.6211 5.68945H23.8457L20.6875 14.2207H19.8145L20.1074 12.9258ZM17.7578 5.68945L20.248 12.9258L20.5586 14.2207H19.6855L16.5332 5.68945H17.7578ZM27.2031 14.3379C26.7617 14.3379 26.3613 14.2637 26.002 14.1152C25.6465 13.9629 25.3398 13.75 25.082 13.4766C24.8281 13.2031 24.6328 12.8789 24.4961 12.5039C24.3594 12.1289 24.291 11.7188 24.291 11.2734V11.0273C24.291 10.5117 24.3672 10.0527 24.5195 9.65039C24.6719 9.24414 24.8789 8.90039 25.1406 8.61914C25.4023 8.33789 25.6992 8.125 26.0312 7.98047C26.3633 7.83594 26.707 7.76367 27.0625 7.76367C27.5156 7.76367 27.9062 7.8418 28.2344 7.99805C28.5664 8.1543 28.8379 8.37305 29.0488 8.6543C29.2598 8.93164 29.416 9.25977 29.5176 9.63867C29.6191 10.0137 29.6699 10.4238 29.6699 10.8691V11.3555H24.9355V10.4707H28.5859V10.3887C28.5703 10.1074 28.5117 9.83398 28.4102 9.56836C28.3125 9.30273 28.1562 9.08398 27.9414 8.91211C27.7266 8.74023 27.4336 8.6543 27.0625 8.6543C26.8164 8.6543 26.5898 8.70703 26.3828 8.8125C26.1758 8.91406 25.998 9.06641 25.8496 9.26953C25.7012 9.47266 25.5859 9.7207 25.5039 10.0137C25.4219 10.3066 25.3809 10.6445 25.3809 11.0273V11.2734C25.3809 11.5742 25.4219 11.8574 25.5039 12.123C25.5898 12.3848 25.7129 12.6152 25.873 12.8145C26.0371 13.0137 26.2344 13.1699 26.4648 13.2832C26.6992 13.3965 26.9648 13.4531 27.2617 13.4531C27.6445 13.4531 27.9688 13.375 28.2344 13.2188C28.5 13.0625 28.7324 12.8535 28.9316 12.5918L29.5879 13.1133C29.4512 13.3203 29.2773 13.5176 29.0664 13.7051C28.8555 13.8926 28.5957 14.0449 28.2871 14.1621C27.9824 14.2793 27.6211 14.3379 27.2031 14.3379ZM32.0195 8.87695V14.2207H30.9355V7.88086H31.9902L32.0195 8.87695ZM34 7.8457L33.9941 8.85352C33.9043 8.83398 33.8184 8.82227 33.7363 8.81836C33.6582 8.81055 33.5684 8.80664 33.4668 8.80664C33.2168 8.80664 32.9961 8.8457 32.8047 8.92383C32.6133 9.00195 32.4512 9.11133 32.3184 9.25195C32.1855 9.39258 32.0801 9.56055 32.002 9.75586C31.9277 9.94727 31.8789 10.1582 31.8555 10.3887L31.5508 10.5645C31.5508 10.1816 31.5879 9.82227 31.6621 9.48633C31.7402 9.15039 31.8594 8.85352 32.0195 8.5957C32.1797 8.33398 32.3828 8.13086 32.6289 7.98633C32.8789 7.83789 33.1758 7.76367 33.5195 7.76367C33.5977 7.76367 33.6875 7.77344 33.7891 7.79297C33.8906 7.80859 33.9609 7.82617 34 7.8457Z"
          fill="#E03177"
        />
      </svg>
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
        classNamePrefix="custom-version-selector"
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
