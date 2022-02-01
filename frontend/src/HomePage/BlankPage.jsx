import React from 'react';

export const BlankPage = function BlankPage({
  createApp,
  darkMode,
  creatingApp,
  handleImportApp,
  isImportingApp,
  fileInput,
}) {
  return (
    <div>
      <div className="page-wrapper">
        <div className="container-xl"></div>
        <div className="page-body">
          <div className="container-xl d-flex flex-column justify-content-center">
            <div className="empty">
              <div className="empty-img">
                <img src="/assets/images/onboarding.svg" alt="" />
              </div>
              <h3 className="empty-welcome-header" style={{ color: darkMode && '#ffffff' }}>
                Welcome to Tooljet!
              </h3>
              <p className="empty-title" style={{ color: darkMode && '#ffffff' }}>
                You can get started by creating a new application or by creating an application using a template in
                ToolJet Library.
              </p>
              <div className="empty-action">
                <a onClick={createApp} className="btn btn-primary">
                  {creatingApp && <span className="spinner-border spinner-border-sm mx-2" role="status"></span>}
                  Create new application
                </a>
                <a className="btn empty-import-button" onChange={handleImportApp}>
                  <label>
                    {isImportingApp && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                    Import an application
                    <input type="file" ref={fileInput} style={{ display: 'none' }} />
                  </label>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
