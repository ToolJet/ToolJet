import React, { useEffect, useState } from 'react';
import { ApiKeyContainer } from './ApiKeyContainer';
import { copilotService, orgEnvironmentVariableService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { CustomToggleSwitch } from '@/Editor/QueryManager/Components/CustomToggleSwitch';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { Button } from '@/_ui/LeftSidebar';
import { useLocalStorageState } from '@/_hooks/use-local-storage';

export const CopilotSetting = () => {
  const { current_organization_id, current_organization_name, admin } = authenticationService.currentSessionValue;
  const currentOrgName = current_organization_name.replace(/\s/g, '').toLowerCase();

  const [copilotApiKey, setCopilotApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useLocalStorageState(`copilotEnabled-${currentOrgName}`, false);
  const [copilotWorkspaceVarId, set] = useState(null);

  const saveCopilotApiKey = async (apikey) => {
    setIsLoading(true);
    const isCopilotApiKeyPresent = await validateApiKey(apikey);

    return setTimeout(() => {
      if (isCopilotApiKeyPresent === true && !copilotWorkspaceVarId) {
        return orgEnvironmentVariableService
          .create(`copilot_api_key-${current_organization_id}`, apikey, 'server', false)
          .then(() => {
            setCopilotApiKey(apikey);
            toast.success('Copilot API key saved successfully');
          })
          .catch((err) => {
            console.log(err);
            return toast.error('Something went wrong');
          })
          .finally(() => {
            setIsLoading(false);
            orgEnvironmentVariableService.create(`copilot_enabled-${current_organization_id}`, 'true', 'client', false);
          });
      }

      if (isCopilotApiKeyPresent === true && copilotWorkspaceVarId) {
        return orgEnvironmentVariableService
          .update(copilotWorkspaceVarId, `copilot_api_key-${current_organization_id}`, apikey)
          .then(() => {
            setCopilotApiKey(apikey);
            toast.success('Copilot API key saved successfully');
          })
          .catch((err) => {
            console.log(err);
            return toast.error('Something went wrong');
          })
          .finally(() => setIsLoading(false));
      }

      return toast.error('API key is not valid') && setIsLoading(false);
    }, 400);
  };

  const handleCopilotToggle = () => {
    setState((prevState) => !prevState);
  };

  const validateApiKey = (apiKey) => {
    return new Promise((resolve, reject) => {
      copilotService
        .validateCopilotAPIKey(apiKey, current_organization_id)
        .then(({ status }) => {
          if (status === 'ok') {
            return resolve(true);
          }

          return resolve(false);
        })
        .catch((err) => {
          return reject(err);
        });
    });
  };

  const updateCopilotEnabled = (id, value, variableName) => {
    return orgEnvironmentVariableService.update(id, variableName, `${value}`).catch((err) => {
      console.log(err);
    });
  };

  useEffect(() => {
    if (!admin) {
      orgEnvironmentVariableService.getVariables().then((data) => {
        const { value } = data.variables.find(
          (variable) => variable.variable_name === `copilot_enabled-${current_organization_id}`
        );

        setState(value === 'true');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (admin) {
      orgEnvironmentVariableService.getVariables().then((data) => {
        const isCopilotApiKeyPresent = data.variables.some(
          (variable) => variable.variable_name === `copilot_api_key-${current_organization_id}`
        );

        const { id, variable_name, value } = data.variables.find(
          (variable) => variable.variable_name === `copilot_enabled-${current_organization_id}`
        );

        if (value !== `${state}`) updateCopilotEnabled(id, state, variable_name);

        const shouldUpdate = state && isCopilotApiKeyPresent;
        if (shouldUpdate) {
          const copilotVariableId = data.variables.find(
            (variable) => variable.variable_name === `copilot_api_key-${current_organization_id}`
          )?.id;
          const key = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
          set(copilotVariableId);
          setCopilotApiKey(key);
        }
      });
    }

    return () => {
      setCopilotApiKey('');
      set(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="wrapper org-variables-page animation-fade">
      <div className="page-wrapper">
        <div className="container-xl">
          <Container isCopilotEnabled={state} handleCopilotToggle={handleCopilotToggle} isAdmin={admin}>
            <div className="row">
              <div className="col-12">
                <ApiKeyContainer
                  copilotApiKey={copilotApiKey}
                  handleOnSave={saveCopilotApiKey}
                  isLoading={isLoading}
                  darkMode={darkMode}
                  isCopilotEnabled={state}
                  isAdmin={admin}
                />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
};

const Container = ({ children, isCopilotEnabled, handleCopilotToggle, darkMode, isAdmin }) => {
  const cardContainerStyles = {
    width: '880px',
    overflow: 'auto',
    height: 'calc(100vh - 156px)',
    margin: '0 auto',
  };
  return (
    <div style={cardContainerStyles} className="card p-2 card-container">
      <div className="card-header row">
        <div className="col-8 d-flex">
          <h3 className="card-title">Copilot</h3>
          <span className="badge bg-color-primary mx-2 mt-1">beta</span>
        </div>
        <div className="col">
          <EducativeLebel darkMode={darkMode} />
        </div>
      </div>
      <div className="card-body">
        <div className="container-fluid">
          <div className="d-flex flex-fill p-3">
            <div className="mb-0 d-flex">
              <CustomToggleSwitch
                isChecked={isCopilotEnabled}
                toggleSwitchFunction={handleCopilotToggle}
                action="enableTransformation"
                dataCy={'copilot'}
                disabled={!isAdmin}
              />

              <span className="mx-2 mt-3 font-weight-400 tranformation-label" data-cy={'label-query-transformation'}>
                Enable Copilot
                <small className="text-muted" style={{ display: 'block' }}>
                  Turn on Copilot functionality in your workspace
                </small>
              </span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const EducativeLebel = ({ darkMode }) => {
  const title = () => {
    return (
      <>
        Learn about ToolJet <strong style={{ fontWeight: 700, color: '#3E63DD' }}>AI copilot</strong>
      </>
    );
  };

  const popoverForRecommendation = (
    <Popover id="transformation-popover-container">
      <div className="transformation-popover card text-center">
        <img src="/assets/images/icons/copilot.svg" alt="AI copilot" height={64} width={64} />
        <div className="d-flex flex-column card-body">
          <h4 className="mb-2">ToolJet x OpenAI</h4>
          <p className="mb-2">
            <strong style={{ fontWeight: 700, color: '#3E63DD' }}>AI copilot</strong> helps you write your queries
            faster. It uses OpenAI&apos;s GPT-3.5 to suggest queries based on your data.
          </p>

          <Button
            darkMode={darkMode}
            size="sm"
            classNames="default-secondary-button"
            styles={{ width: '100%', fontSize: '12px', fontWeight: 700, borderColor: darkMode && 'transparent' }}
            onClick={() => window.open('https://docs.tooljet.com/docs/tooljet-copilot', '_blank')}
          >
            <Button.Content title={'Read more'} />
          </Button>
        </div>
      </div>
    </Popover>
  );

  return (
    <div className="d-flex justify-content-end">
      <Button.UnstyledButton styles={{ height: '28px' }} darkMode={false} classNames="mx-1">
        <Button.Content title={title} iconSrc={'assets/images/icons/flash.svg'} direction="left" />
      </Button.UnstyledButton>
      <OverlayTrigger trigger="click" placement="left" overlay={popoverForRecommendation} rootClose>
        <svg
          width="16.7"
          height="16.7"
          viewBox="0 0 20 21"
          fill="#3E63DD"
          xmlns="http://www.w3.org/2000/svg"
          style={{ cursor: 'pointer' }}
          data-cy={`transformation-info-icon`}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 2.5C5.58172 2.5 2 6.08172 2 10.5C2 14.9183 5.58172 18.5 10 18.5C14.4183 18.5 18 14.9183 18 10.5C18 6.08172 14.4183 2.5 10 2.5ZM0 10.5C0 4.97715 4.47715 0.5 10 0.5C15.5228 0.5 20 4.97715 20 10.5C20 16.0228 15.5228 20.5 10 20.5C4.47715 20.5 0 16.0228 0 10.5ZM9 6.5C9 5.94772 9.44771 5.5 10 5.5H10.01C10.5623 5.5 11.01 5.94772 11.01 6.5C11.01 7.05228 10.5623 7.5 10.01 7.5H10C9.44771 7.5 9 7.05228 9 6.5ZM8 10.5C8 9.94771 8.44772 9.5 9 9.5H10C10.5523 9.5 11 9.94771 11 10.5V13.5C11.5523 13.5 12 13.9477 12 14.5C12 15.0523 11.5523 15.5 11 15.5H10C9.44771 15.5 9 15.0523 9 14.5V11.5C8.44772 11.5 8 11.0523 8 10.5Z"
            fill="#3E63DD"
          />
        </svg>
      </OverlayTrigger>
    </div>
  );
};
