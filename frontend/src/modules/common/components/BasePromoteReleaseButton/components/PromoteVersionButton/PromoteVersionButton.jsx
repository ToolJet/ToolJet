import React, { useState } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { shallow } from 'zustand/shallow';
import { ToolTip } from '@/_components/ToolTip';
import { PromoteConfirmationModal } from './components';
import useStore from '@/AppBuilder/_stores/store';
import { Button } from '@/components/ui/Button/Button';
import { ArrowBigUpDash } from 'lucide-react';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useTranslation } from 'react-i18next';

const PromoteVersionButton = () => {
  const [promoteModalData, setPromoteModalData] = useState(null);
  const { moduleId } = useModuleContext();
  const getCanPromoteAndRelease = useStore((state) => state.getCanPromoteAndRelease);
  const { isPromoteVersionEnabled } = getCanPromoteAndRelease();
  const { isSaving, editingVersion, appVersionEnvironment, environments, selectedEnvironment, currentEnvIndex } =
    useStore(
      (state) => ({
        isSaving: state.appStore.modules[moduleId].app.isSaving,
        editingVersion: state.currentVersionId,
        selectedEnvironment: state.selectedEnvironment,
        environments: state.environments,
        appVersionEnvironment: state.appVersionEnvironment,
        currentEnvIndex: state.environments?.findIndex((env) => env?.id === state.appVersionEnvironment?.id),
      }),
      shallow
    );

  // enable only after the environment details are loaded
  const shouldDisablePromote =
    isSaving ||
    selectedEnvironment?.priority < appVersionEnvironment?.priority ||
    !appVersionEnvironment ||
    !environments?.[currentEnvIndex + 1];

  const handlePromote = () => {
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

  return (
    <>
      <ToolTip
        message={renderTooltipMessage()}
        placement="bottom"
        show={!shouldDisablePromote || !isPromoteVersionEnabled}
      >
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
