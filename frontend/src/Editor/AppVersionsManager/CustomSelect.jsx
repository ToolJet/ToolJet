import React, { useState } from 'react';
import cx from 'classnames';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import { EditVersion } from './EditVersionModal';
import { CreateVersion } from './CreateVersionModal';
import { ConfirmDialog } from '@/_components';
import { defaultAppEnvironments } from '@/_helpers/utils';

const Menu = (props) => {
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
                <svg
                  className="icon"
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="28" height="28" rx="6" fill="#F0F4FF" />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M16.7467 8.69582C17.0858 8.35696 17.5456 8.1666 18.025 8.1666C18.5046 8.1666 18.9646 8.35713 19.3037 8.69627C19.6429 9.03541 19.8334 9.49538 19.8334 9.975C19.8334 10.4545 19.643 10.9143 19.304 11.2534C19.3039 11.2535 19.3041 11.2533 19.304 11.2534L18.5667 11.9934C18.5462 12.0236 18.5226 12.0524 18.4958 12.0791C18.4695 12.1054 18.4414 12.1287 18.4118 12.1489L14.4132 16.1617C14.3038 16.2716 14.1551 16.3333 14 16.3333H12.25C11.9278 16.3333 11.6667 16.0722 11.6667 15.75V14C11.6667 13.8449 11.7284 13.6962 11.8383 13.5868L15.8511 9.58823C15.8713 9.55862 15.8946 9.53046 15.9209 9.50419C15.9476 9.4774 15.9764 9.45376 16.0066 9.43327L16.7463 8.69627C16.7464 8.69612 16.7466 8.69597 16.7467 8.69582ZM16.3399 10.7482L12.8333 14.2422V15.1667H13.7578L17.2518 11.6601L16.3399 10.7482ZM18.0753 10.8337L17.1663 9.9247L17.5712 9.52123C17.6916 9.40088 17.8548 9.33327 18.025 9.33327C18.1952 9.33327 18.3584 9.40088 18.4788 9.52123C18.5991 9.64158 18.6667 9.8048 18.6667 9.975C18.6667 10.1452 18.5991 10.3084 18.4788 10.4288L18.0753 10.8337ZM9.26256 11.0126C9.59075 10.6844 10.0359 10.5 10.5 10.5H11.0833C11.4055 10.5 11.6667 10.7612 11.6667 11.0833C11.6667 11.4055 11.4055 11.6667 11.0833 11.6667H10.5C10.3453 11.6667 10.1969 11.7281 10.0875 11.8375C9.97812 11.9469 9.91667 12.0953 9.91667 12.25V17.5C9.91667 17.6547 9.97812 17.8031 10.0875 17.9125C10.1969 18.0219 10.3453 18.0833 10.5 18.0833H15.75C15.9047 18.0833 16.0531 18.0219 16.1625 17.9125C16.2719 17.8031 16.3333 17.6547 16.3333 17.5V16.9167C16.3333 16.5945 16.5945 16.3333 16.9167 16.3333C17.2388 16.3333 17.5 16.5945 17.5 16.9167V17.5C17.5 17.9641 17.3156 18.4092 16.9874 18.7374C16.6592 19.0656 16.2141 19.25 15.75 19.25H10.5C10.0359 19.25 9.59075 19.0656 9.26256 18.7374C8.93437 18.4092 8.75 17.9641 8.75 17.5V12.25C8.75 11.7859 8.93437 11.3408 9.26256 11.0126Z"
                    fill="#3E63DD"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
        <hr className="m-0" />
        <div>{props.children}</div>
        <div
          className="cursor-pointer tj-text-xsm"
          style={{ padding: '8px 12px', color: '#3E63DD' }}
          onClick={() => props.selectProps.setShowCreateAppVersion(true)}
        >
          <svg
            className="icon me-1"
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="34" height="34" rx="6" fill="#F0F4FF" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17 11C17.4142 11 17.75 11.3358 17.75 11.75V16.25H22.25C22.6642 16.25 23 16.5858 23 17C23 17.4142 22.6642 17.75 22.25 17.75H17.75V22.25C17.75 22.6642 17.4142 23 17 23C16.5858 23 16.25 22.6642 16.25 22.25V17.75H11.75C11.3358 17.75 11 17.4142 11 17C11 16.5858 11.3358 16.25 11.75 16.25H16.25V11.75C16.25 11.3358 16.5858 11 17 11Z"
              fill="#3E63DD"
            />
          </svg>
          Create new version
        </div>
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

export const CustomSelect = ({ ...props }) => {
  const [showEditAppVersion, setShowEditAppVersion] = useState(false);
  const [showCreateAppVersion, setShowCreateAppVersion] = useState(false);

  const { deleteVersion, deleteAppVersion, resetDeleteModal } = props;

  return (
    <>
      <CreateVersion
        {...props}
        showCreateAppVersion={showCreateAppVersion}
        setShowCreateAppVersion={setShowCreateAppVersion}
      />
      <EditVersion {...props} showEditAppVersion={showEditAppVersion} setShowEditAppVersion={setShowEditAppVersion} />
      {/*  When we merge this code to EE update the defaultAppEnvironments object with rest of default environments (then delete this comment)*/}
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
        components={{ Menu, SingleValue }}
        setShowEditAppVersion={setShowEditAppVersion}
        setShowCreateAppVersion={setShowCreateAppVersion}
        styles={{ border: 0 }}
        {...props}
      />
    </>
  );
};
