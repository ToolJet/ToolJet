import React, { useEffect, useState } from 'react';
import { Button } from '@/_ui/LeftSidebar';
import { Alert } from '@/_ui/Alert/';

export const ApiKeyContainer = ({
  copilotApiKey = '',
  handleOnSave,
  isLoading = false,
  darkMode,
  isCopilotEnabled,
  isAdmin = false,
}) => {
  const [inputValue, setInputValue] = useState(copilotApiKey);

  const handleOnchange = (e) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    setInputValue(copilotApiKey);
  }, [copilotApiKey]);

  const AdminInfoComponent = () => {
    return (
      <>
        <h4 class="alert-title"> Don&apos;t have an API key?</h4>
        <div class="text-muted">
          <strong style={{ fontWeight: 700, color: '#3E63DD' }}>ToolJet Copilot </strong>
          is currently in <strong style={{ fontWeight: 700, color: '#3E63DD' }}>beta</strong> and provided on request.
          Join our waitlist to be notified when API keys become available, or sign up for beta access to get started
          today.
        </div>
        <div className="mt-2 w-25">
          <Button
            onClick={() => window.open('https://tooljet.com/copilot', '_blank')}
            darkMode={darkMode}
            size="sm"
            styles={{ width: '100%', fontSize: '12px', fontWeight: 500, borderColor: darkMode && 'transparent' }}
          >
            <Button.Content title={' Sign up for Beta Access'} />
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="container-xl mt-3">
      {isAdmin && (
        <div className="row">
          <small className="text-green">
            <img className="encrypted-icon" src="assets/images/icons/padlock2.svg" width="12" height="12" />
            <span className="text-success mx-2 font-500">API KEY</span>
          </small>
          <div className="mb-3 col-6 tj-app-input">
            <input
              disabled={!isCopilotEnabled}
              type="password"
              class="form-control"
              name="example-text-input"
              placeholder=""
              value={inputValue}
              onChange={handleOnchange}
            />
          </div>
          <div className="col-auto mt-1">
            <Button
              onClick={() => handleOnSave(inputValue)}
              darkMode={darkMode}
              size="md"
              isLoading={isLoading}
              styles={{ backgroundColor: '#3E63DD', color: '#fff' }}
              disabled={!isCopilotEnabled}
            >
              <Button.Content title={'Save'} iconSrc={'assets/images/icons/save.svg'} />
            </Button>
          </div>
        </div>
      )}

      <div className="alert-container">
        <Alert svg="alert-info" cls="copilot-alert" data-cy={`copilot-alert-info`}>
          {isAdmin ? (
            <AdminInfoComponent />
          ) : (
            <>
              <div class="text-muted">
                <strong style={{ fontWeight: 700, color: '#3E63DD' }}>ToolJet Copilot </strong>
                is currently in <strong style={{ fontWeight: 700, color: '#3E63DD' }}>beta</strong> and provided on
                request. Join our waitlist to be notified when API keys become available, or sign up for beta access to
                get started today.
              </div>
              <div class="text-muted mt-2">
                <strong style={{ fontWeight: 700, color: '#df4759' }}>Please note : </strong>
                Copilot functionality is dependent on your workspace admin completing the setup process.
              </div>
            </>
          )}
        </Alert>
      </div>
    </div>
  );
};
