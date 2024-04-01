import React, { useEffect } from 'react';
import { capitalize } from 'lodash';
import EnvironmentSelectBox from './EnvironmentSelectBox';
import { ToolTip } from '@/_components/ToolTip';
import '@/_styles/versions.scss';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { useEditorStore } from '@/_stores/editorStore';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useAppDataStore } from '@/_stores/appDataStore';

const EnvironmentManager = (props) => {
  const {
    appEnvironmentChanged,
    environments,
    setCurrentEnvironment,
    multiEnvironmentEnabled,
    setCurrentAppVersionPromoted,
    licenseValid,
    isViewer,
    licenseType,
  } = props;

  const { currentAppEnvironmentId, currentAppEnvironment, currentLayout } = useEditorStore(
    (state) => ({
      currentAppEnvironmentId: state?.currentAppEnvironmentId,
      currentAppEnvironment: state?.currentAppEnvironment,
      currentLayout: state.currentLayout,
    }),
    shallow
  );
  const { currentAppVersionEnvironment, editingVersion } = useAppVersionStore(
    (state) => ({
      currentAppVersionEnvironment: state.currentAppVersionEnvironment,
      editingVersion: state.editingVersion,
    }),
    shallow
  );

  const { creationMode } = useAppDataStore(
    (state) => ({
      creationMode: state.creationMode,
    }),
    shallow
  );

  /**
   * if the current promoted environment is production or staging, then we need to freeze the editor
   */

  useEffect(() => {
    if (!currentAppVersionEnvironment || !environments.length) return;

    if (
      creationMode == 'GIT' ||
      currentAppVersionEnvironment.name === 'production' ||
      currentAppVersionEnvironment.name === 'staging'
    ) {
      setCurrentAppVersionPromoted(true);
    } else {
      setCurrentAppVersionPromoted(false);
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
    const showTrialTag = licenseType === 'trial' && licenseValid && environment.priority > 1;
    return {
      value: environment.id,
      environmentName: environment.name,
      onClick: handleClick,
      haveVersions,
      priority: environment.priority,
      enabled: environment.enabled,
      label: (
        <div className="env-option" key={index}>
          <div className="col-10 env-name">
            <ToolTip
              message={
                showTrialTag ? 'Multi-environments is a paid plan feature' : 'There are no versions in this environment'
              }
              placement="right"
              show={haveVersions || !multiEnvironmentEnabled ? (showTrialTag ? true : false) : true}
            >
              <div className="d-flex align-items-center">
                <div
                  className={`app-environment-name d-flex ${darkMode ? 'dark-theme' : ''}`}
                  style={grayColorStyle}
                  data-cy="env-name-dropdown"
                >
                  {capitalize(environment.name)}
                </div>
                {environment.priority > 1 && (!multiEnvironmentEnabled || licenseType === 'trial') && (
                  <SolidIcon name="enterprisesmall" />
                )}
              </div>
            </ToolTip>
          </div>
        </div>
      ),
    };
  });

  return (
    <div
      className="app-environment-menu"
      style={{
        marginLeft: isViewer && currentLayout === 'mobile' ? '0px' : '1rem',
        maxWidth: isViewer && currentLayout === 'mobile' ? '100%' : '180px',
      }}
    >
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
