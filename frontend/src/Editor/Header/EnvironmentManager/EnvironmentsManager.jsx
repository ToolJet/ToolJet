import { useEnvironmentsAndVersionsStore } from '@/_stores/environmentsAndVersionsStore';
import React, { useEffect, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import EnvironmentSelectBox from './EnvironmentSelectBox';
import { useEditorStore } from '@/_stores/editorStore';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import { capitalize } from 'lodash';
import toast from 'react-hot-toast';

const EnvironmentManager = (props) => {
  const { appEnvironmentChanged, multiEnvironmentEnabled, licenseValid, isViewer, licenseType } = props;

  const { editingVersionId } = useAppVersionStore(
    (state) => ({
      editingVersionId: state?.editingVersion?.id,
    }),
    shallow
  );

  const {
    init,
    selectedEnvironment,
    environments,
    setEnvironmentDropdownStatus,
    initializedEnvironmentDropdown,
    environmentChangedAction,
  } = useEnvironmentsAndVersionsStore(
    (state) => ({
      environments: state.environments,
      selectedEnvironment: state.selectedEnvironment,
      initializedEnvironmentDropdown: state.initializedEnvironmentDropdown,
      init: state.actions.init,
      setEnvironmentDropdownStatus: state.actions.setEnvironmentDropdownStatus,
      environmentChangedAction: state.actions.environmentChangedAction,
    }),
    shallow
  );

  const { currentLayout } = useEditorStore(
    (state) => ({
      currentLayout: state.currentLayout,
    }),
    shallow
  );

  useEffect(() => {
    !initializedEnvironmentDropdown && initComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initComponent = async () => {
    await init(editingVersionId);
    setEnvironmentDropdownStatus(true);
  };

  const selectEnvironment = (env) => {
    environmentChangedAction(
      env,
      (response) => {
        appEnvironmentChanged(response);
      },
      (error) => {
        toast.error(error);
      }
    );
  };

  // if any app is in production, then it is also in staging. So, we need to check if there is any version in production
  const darkMode = darkMode ?? (localStorage.getItem('darkMode') === 'true' || false);

  const options = useMemo(() => {
    if (!environments.length) return [];
    const haveVersionInProduction = environments.find((env) => env.name === 'production' && env.appVersionsCount > 0);
    return environments.map((environment, index) => {
      const haveVersions = environment.appVersionsCount > 0 || haveVersionInProduction;
      const grayColorStyle = haveVersions ? { cursor: 'pointer' } : { color: '#687076' };
      const handleClick = () => {
        if (haveVersions) {
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
                  showTrialTag
                    ? 'Multi-environments is a paid plan feature'
                    : 'There are no versions in this environment'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environments]);

  return (
    <>
      <div
        className="app-environment-menu"
        style={{
          marginLeft: isViewer && currentLayout === 'mobile' ? '0px' : '1rem',
          maxWidth: isViewer && currentLayout === 'mobile' ? '100%' : '180px',
        }}
      >
        <EnvironmentSelectBox options={options} currentEnv={selectedEnvironment} licenseValid={licenseValid} />
      </div>
    </>
  );
};

export default EnvironmentManager;
