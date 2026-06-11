import React from 'react';

const DefaultSSOModal = ({
  showModal,
  currentSSO,
  settings,
  onClose,
  onUpdateSSOSettings,
  isInstanceOptionEnabled,
  defaultSSOModals = {}, // Provide default empty object
}) => {
  const modalProps = {
    settings,
    onClose,
    onUpdateSSOSettings,
    isInstanceOptionEnabled,
  };
  const { GoogleSSOModal = () => null, GithubSSOModal = () => null } = defaultSSOModals || {};

  return (
    <>
      {showModal && currentSSO === 'google' && <GoogleSSOModal {...modalProps} />}
      {showModal && currentSSO === 'git' && <GithubSSOModal {...modalProps} />}
    </>
  );
};

export default DefaultSSOModal;
