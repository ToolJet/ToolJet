import React from 'react';
import TemplateLibraryModal from './TemplateLibraryModal/';

export const BlankPage = function BlankPage({
  createApp,
  darkMode,
  creatingApp,
  handleImportApp,
  isImportingApp,
  fileInput,
  showTemplateLibraryModal,
  hideTemplateLibraryModal,
  viewTemplateLibraryModal,
}) {
  return (
    <div>
      <div className="page-wrapper">
        <div className="container-xl"></div>
        <div className="page-body">
          <div className="container-xl d-flex flex-column justify-content-center">
            <div className="empty">
              <div className="empty-img">
                <img
                  src={darkMode ? '/assets/images/dark-mode-onboarding.svg' : '/assets/images/onboarding.svg'}
                  alt=""
                />
              </div>
              <h3 className="empty-welcome-header" style={{ color: darkMode && '#ffffff' }}>
                Welcome to ToolJet!
              </h3>
              <p className={`empty-title ${darkMode && 'text-white-50'}`}>
                You can get started by creating a new application or by creating an application using a template in
                ToolJet Library.
              </p>
              <div className="empty-action">
                <a onClick={createApp} className={`btn btn-primary ${creatingApp ? 'btn-loading' : ''}`}>
                  Create new application
                </a>
                <a
                  className={`btn empty-import-button ${isImportingApp ? 'btn-loading' : ''}`}
                  onChange={handleImportApp}
                >
                  <label style={{ visibility: isImportingApp ? 'hidden' : 'visible' }}>
                    Import an application
                    <input type="file" ref={fileInput} style={{ display: 'none' }} />
                  </label>
                </a>
                <a onClick={viewTemplateLibraryModal} className="btn btn-primary" style={{ marginLeft: '24px' }}>
                  Choose from template
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TemplateLibraryModal
        show={showTemplateLibraryModal}
        onHide={hideTemplateLibraryModal}
        onCloseButtonClick={hideTemplateLibraryModal}
        darkMode={darkMode}
      />
    </div>
  );
};
