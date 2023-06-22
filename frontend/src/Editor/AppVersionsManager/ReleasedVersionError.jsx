import React from 'react';
import cx from 'classnames';
import { useAppVersionStore } from '@/_stores/appVersionStore';

export const ReleasedVersionError = () => {
  const { isUserEditingTheVersion, disableReleasedVersionPopupState } = useAppVersionStore((state) => ({
    isUserEditingTheVersion: state.isUserEditingTheVersion,
    disableReleasedVersionPopupState: state.actions.disableReleasedVersionPopupState,
  }));
  const changeBackTheState = () => {
    isUserEditingTheVersion && disableReleasedVersionPopupState();
  };

  React.useState(() => {
    const intervalId = setInterval(() => changeBackTheState(), 2000);
    return () => intervalId && clearInterval(intervalId);
  }, [isUserEditingTheVersion]);

  return (
    <div className="released-version-popup-container">
      <div className={cx('released-version-popup-cover', isUserEditingTheVersion && 'error-shake')}>
        <div className="d-flex popup-content">
          <div className="me-3">
            <svg width="28" height="27" viewBox="0 0 28 27" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle opacity="0.4" cx="14" cy="13.6289" r="13.3333" fill="#E54D2E" />
              <path
                d="M15.3333 6.96224C15.3333 7.69862 14.7364 8.29557 14 8.29557C13.2636 8.29557 12.6667 7.69862 12.6667 6.96224C12.6667 6.22586 13.2636 5.62891 14 5.62891C14.7364 5.62891 15.3333 6.22586 15.3333 6.96224Z"
                fill="#E54D2E"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M11.6667 10.9622C11.6667 10.41 12.1144 9.96225 12.6667 9.96225H14C14.5523 9.96225 15 10.41 15 10.9622V20.2956C15 20.8479 14.5523 21.2956 14 21.2956C13.4477 21.2956 13 20.8479 13 20.2956V11.9622H12.6667C12.1144 11.9622 11.6667 11.5145 11.6667 10.9622Z"
                fill="#E54D2E"
              />
            </svg>
          </div>
          <p>This is a released app. Create a new version to make changes.</p>
        </div>
      </div>
    </div>
  );
};
