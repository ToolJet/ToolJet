import React, { useState, useEffect } from 'react';
import { appEnvironmentService } from '@/_services';
import { capitalize } from 'lodash';
import { CustomSelect } from './CustomSelect';

const EnvironmentManager = ({ currentAppEnvironmentId, versionId, appEnvironmentChanged }) => {
  const [environments, setEnvironments] = useState([]);
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
    appEnvironmentChanged(env?.id, isVersionChanged);
  };

  const options = environments.map((environment) => ({
    value: environment.id,
    environmentName: environment.name,
    label: (
      <div className="row align-items-center app-environment-list-item">
        <div className="col-10">
          <div className="app-environment-name">{capitalize(environment.name)}</div>
        </div>
      </div>
    ),
  }));

  return (
    <div className="app-environment-menu">
      <CustomSelect options={options} value={currentAppEnvironmentId} onChange={(id) => appEnvironmentChanged(id)} />
    </div>
  );
};

export default EnvironmentManager;
