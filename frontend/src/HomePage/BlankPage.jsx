import React from 'react';

export const BlankPage = function BlankPage({ createApp, handleImportApp, isImportingApp, fileInput }) {
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
              <h3 className="empty-welcome-header">Welcome to Tooljet!</h3>
              <p className="empty-title">
                Welcome to ToolJet ! You can get started by creating a new application or by creating an application
                using a template in ToolJet Library.
              </p>
              <div className="empty-action">
                <a onClick={createApp} className="btn text-light mx-1">
                  Create new app
                </a>
                <a
                  href="https://docs.tooljet.io"
                  target="_blank"
                  className="btn text-light mx-1 empty-import-button"
                  rel="noreferrer"
                  onChange={handleImportApp}
                >
                  <label>
                    {isImportingApp && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                    Import App
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
