import React, { useEffect } from 'react';
import { capitalize } from 'lodash';
import EnvironmentSelectBox from './EnvironmentSelectBox';
import { ToolTip } from '@/_components/ToolTip';
import '@/_styles/versions.scss';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { useEditorStore } from '@/_stores/editorStore';

const EnvironmentManager = (props) => {
  const {
    appEnvironmentChanged,
    environments,
    setCurrentEnvironment,
    multiEnvironmentEnabled,
    setCurrentAppVersionPromoted,
    licenseValid,
  } = props;

  const { currentAppEnvironmentId, currentAppEnvironment } = useEditorStore(
    (state) => ({
      currentAppEnvironmentId: state?.currentAppEnvironmentId,
      currentAppEnvironment: state?.currentAppEnvironment,
    }),
    shallow
  );

  const { onEditorFreeze, currentAppVersionEnvironment, editingVersion } = useAppVersionStore(
    (state) => ({
      onEditorFreeze: state.actions.onEditorFreeze,
      currentAppVersionEnvironment: state.currentAppVersionEnvironment,
      editingVersion: state.editingVersion,
    }),
    shallow
  );

  /**
   * if the current promoted environment is production or staging, then we need to freeze the editor
   */

  useEffect(() => {
    if (!currentAppVersionEnvironment || !environments.length) return;

    if (currentAppVersionEnvironment.name === 'production' || currentAppVersionEnvironment.name === 'staging') {
      onEditorFreeze(true);
      setCurrentAppVersionPromoted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAppVersionEnvironment, editingVersion.id, environments.length]);

  const selectEnvironment = (env) => {
    appEnvironmentChanged(env, true);
  };

  // if any app is in production, then it is also in staging. So, we need to check if there is any version in production
  const haveVersionInProduction = environments.find((env) => env.name === 'production' && env.app_versions_count > 0);
  const darkMode = darkMode ?? (localStorage.getItem('darkMode') === 'true' || false);

  const options = environments.map((environment, index) => {
    // either there are versions in this environment or it is production environment
    const haveVersions = environment.app_versions_count > 0 || haveVersionInProduction;
    const grayColorStyle = haveVersions ? { cursor: 'pointer' } : { color: '#687076' };
    const handleClick = () => {
      if (haveVersions) {
        setCurrentEnvironment({ ...environment, index });
        selectEnvironment(environment);
      }
    };
    return {
      value: environment.id,
      environmentName: environment.name,
      onClick: handleClick,
      haveVersions,
      priority: environment.priority,
      enabled: environment.enabled,
      label: (
        <div className="env-option" key={index}>
          <div className="col-10">
            <ToolTip
              message="There are no versions in this environment"
              placement="left"
              show={haveVersions || !multiEnvironmentEnabled ? false : true}
            >
              <div className={`app-environment-name ${darkMode ? 'dark-theme' : ''}`} style={grayColorStyle}>
                {capitalize(environment.name)}
              </div>
            </ToolTip>
          </div>
        </div>
      ),
    };
  });

  return (
    <div className="app-environment-menu">
      <EnvironmentSelectBox
        options={options}
        currentEnv={currentAppEnvironment}
        onEnvChange={(env) => selectEnvironment(env)}
        versionId={editingVersion.id}
        licenseValid={licenseValid}
      />
    </div>
  );
};

export default EnvironmentManager;
