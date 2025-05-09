import React, { useEffect, useCallback } from 'react';
import cx from 'classnames';
import Branch from '@assets/images/icons/branch.svg';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';

const FreezeVersionInfo = ({
  info = 'App cannot be edited after promotion. Please create a new version from Development to make any changes.',
  hide = false,
}) => {
  const isViewOnly = useStore((state) => state.getShouldFreeze());
  const isAiOperationInProgress = useStore((state) => state?.ai?.isLoading);

  // const { isUserEditingTheVersion, disableReleasedVersionPopupState } = useAppVersionStore(
  //   (state) => ({
  //     isUserEditingTheVersion: state.isUserEditingTheVersion,
  //     disableReleasedVersionPopupState: state.actions.disableReleasedVersionPopupState,
  //   }),
  //   shallow
  // );
  // const changeBackTheState = useCallback(() => {
  //   isUserEditingTheVersion && disableReleasedVersionPopupState();
  // }, [isUserEditingTheVersion, disableReleasedVersionPopupState]);

  // useEffect(() => {
  //   const intervalId = setInterval(() => changeBackTheState(), 2000);
  //   return () => intervalId && clearInterval(intervalId);
  // }, [isUserEditingTheVersion, changeBackTheState]);

  if (!isViewOnly || hide || isAiOperationInProgress) return null;

  return (
    <div className="released-version-popup-container">
      {/* <div className={cx('released-version-popup-cover', isUserEditingTheVersion && 'error-shake')}> */}
      <div className={cx('released-version-popup-cover')}>
        <div
          className="d-flex popup-content"
          style={{
            width: '330px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
          }}
        >
          <div className="me-3">
            <Branch />
          </div>
          <p style={{ marginBottom: '0' }} data-cy="warning-text">
            {info}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FreezeVersionInfo;
