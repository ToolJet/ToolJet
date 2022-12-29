import React, { useState, useEffect } from 'react';
import { appEnvironmentService } from '@/_services';
import { capitalize } from 'lodash';

const EnvironmentManager = ({ currentAppEnvironmentId, versionId, appEnvironmentChanged }) => {
  const [showDropDown, setShowDropDown] = useState(false);
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState(null);
  useEffect(() => {
    versionId && fetchEnvironments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId]);

  const fetchEnvironments = () => {
    appEnvironmentService.getAllEnvironments(versionId).then((data) => {
      const envArray = data?.environments;
      setEnvironments(envArray);
      if (envArray.length > 0) {
        const env = currentAppEnvironmentId
          ? envArray.find((env) => env.id === currentAppEnvironmentId)
          : envArray.find((env) => env.is_default === true);
        selectEnvironment(env, true);
      }
    });
  };

  const selectEnvironment = (env, isVersionChanged = false) => {
    setCurrentEnvironment(env);
    appEnvironmentChanged(env?.id, isVersionChanged);
  };

  return (
    <span
      className={`app-environment-menu form-select`}
      onClick={() => {
        setShowDropDown(!showDropDown);
      }}
    >
      {currentEnvironment && (
        <span>
          <span className="px-1">{capitalize(currentEnvironment.name)}</span>
        </span>
      )}
      {showDropDown && (
        <>
          <div className="dropdown-menu show">
            <div className="">
              {environments.map((env) => (
                <>
                  <div className="dropdown-item row" key={env.id} onClick={() => selectEnvironment(env)}>
                    <div className="col-*">{capitalize(env.name)}</div>
                  </div>
                  <div className="dropdown-divider m-0"></div>
                </>
              ))}
            </div>
          </div>
        </>
      )}
    </span>
  );
};

export default EnvironmentManager;
