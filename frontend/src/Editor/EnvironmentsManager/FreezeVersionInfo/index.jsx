import React, { useEffect, useCallback } from 'react';
import cx from 'classnames';
import Branch from '@assets/images/icons/branch.svg';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

export const FreezeVersionInfo = () => {
  const { isUserEditingTheVersion, disableReleasedVersionPopupState } = useAppVersionStore(
    (state) => ({
      isUserEditingTheVersion: state.isUserEditingTheVersion,
      disableReleasedVersionPopupState: state.actions.disableReleasedVersionPopupState,
    }),
    shallow
  );
  const changeBackTheState = useCallback(() => {
    isUserEditingTheVersion && disableReleasedVersionPopupState();
  }, [isUserEditingTheVersion, disableReleasedVersionPopupState]);

  useEffect(() => {
    const intervalId = setInterval(() => changeBackTheState(), 2000);
    return () => intervalId && clearInterval(intervalId);
  }, [isUserEditingTheVersion, changeBackTheState]);

  return (
    <div className="released-version-popup-container">
      <div className={cx('released-version-popup-cover', isUserEditingTheVersion && 'error-shake')}>
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
            App cannot be edited after promotion. Please create a new version from Development to make any changes.
          </p>
        </div>
      </div>
    </div>
  );
};
