import React, { useState } from 'react';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import { ToolTip } from '@/_components/ToolTip';
import '@/_styles/versions.scss';
import { PromoteConfirmationModal } from './components';
import useStore from '@/AppBuilder/_stores/store';
import { Button } from '@/components/ui/Button/Button';
import { ArrowBigUpDash } from 'lucide-react';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useTranslation } from 'react-i18next';

const PromoteVersionButton = ({ version = null, variant = 'default', darkMode = false }) => {
  const [promoteModalData, setPromoteModalData] = useState(null);
  const { moduleId } = useModuleContext();
  const getCanPromoteAndRelease = useStore((state) => state.getCanPromoteAndRelease);
  const { isPromoteVersionEnabled } = getCanPromoteAndRelease();
  const { isSaving, editingVersion, appVersionEnvironment, environments, selectedEnvironment, currentEnvIndex } =
    useStore(
      (state) => ({
        isSaving: state.appStore.modules[moduleId].app.isSaving,
        editingVersion: version?.id || state.currentVersionId,
        selectedEnvironment: state.selectedEnvironment,
        environments: state.environments,
        appVersionEnvironment: version?.currentEnvironmentId
          ? state.environments?.find((env) => env.id === version.currentEnvironmentId)
          : state.appVersionEnvironment,
        currentEnvIndex: version?.currentEnvironmentId
          ? state.environments?.findIndex((env) => env?.id === version.currentEnvironmentId)
          : state.environments?.findIndex((env) => env?.id === state.appVersionEnvironment?.id),
      }),
      shallow
    );

  // enable only after the environment details are loaded
  const shouldDisablePromote =
    isSaving ||
    selectedEnvironment?.priority < appVersionEnvironment?.priority ||
    !appVersionEnvironment ||
    !environments?.[currentEnvIndex + 1];

  const handlePromote = (e) => {
    if (e) e.stopPropagation();
    setPromoteModalData({
      current: appVersionEnvironment,
      target: environments[currentEnvIndex + 1],
    });
  };
  const renderTooltipMessage = () => {
    if (!isPromoteVersionEnabled) {
      return "You don't have access to promote application. Contact admin to know more.";
    }
    if (!shouldDisablePromote) {
      return 'Promote this version to the next environment';
    }
    return '';
  };
  const { t } = useTranslation();

  // Inline variant for dropdown
  if (variant === 'inline') {
    return (
      <>
        <ToolTip message={renderTooltipMessage()} placement="left" width="280px">
          <span>
            <button
              className={cx('btn btn-sm version-action-btn', { 'dark-theme theme-dark': darkMode })}
              disabled={shouldDisablePromote || !isPromoteVersionEnabled}
              onClick={handlePromote}
              data-cy="promote-version-button"
            >
              Promote
            </button>
          </span>
        </ToolTip>
        <PromoteConfirmationModal
          data={promoteModalData}
          editingVersion={editingVersion}
          onClose={() => setPromoteModalData(null)}
          fetchEnvironments={() => {}}
        />
      </>
    );
  }

  // Default variant (header button)
  return (
    <>
      <ToolTip
        message={renderTooltipMessage()}
        placement="bottom"
        show={shouldDisablePromote || !isPromoteVersionEnabled}
        width="280px"
      >
        <div>
          <Button
            variant="secondary"
            className="tw-text-text-default"
            disabled={shouldDisablePromote || !isPromoteVersionEnabled}
            data-cy="promote-button"
            onClick={handlePromote}
          >
            <ArrowBigUpDash width="16" height="16" className="tw-text-icon-accent" />
            {t('editor.promote', 'Promote')}
          </Button>
        </div>
      </ToolTip>
      <PromoteConfirmationModal
        data={promoteModalData}
        editingVersion={editingVersion}
        onClose={() => setPromoteModalData(null)}
        fetchEnvironments={() => {}}
      />
    </>
  );
};

export default PromoteVersionButton;
