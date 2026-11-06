import { useVersionLifecycle } from '@/AppBuilder/Header/VersionManager/VersionLifecycleContext';
import { withAppVersionLifecycle } from '@/AppBuilder/Header/VersionManager/AppVersionLifecycleProvider';
import React, { useState } from 'react';
import cx from 'classnames';
import { ToolTip } from '@/_components/ToolTip';
import '@/_styles/versions.scss';
import { PromoteConfirmationModal } from './components';
import { Button } from '@/components/ui/Button/Button';
import { ArrowBigUpDash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PromoteVersionButton = ({ version = null, variant = 'default', darkMode = false }) => {
  const [promoteModalData, setPromoteModalData] = useState(null);
  const { versions, selectedVersionId, selectedEnvironment, environments, capabilities = {} } = useVersionLifecycle();
  const isPromoteVersionEnabled = capabilities.canPromote;
  const isSaving = capabilities.isSaving;
  const editingVersion = version?.id || selectedVersionId;
  const selected = version || versions.find((v) => v.id === editingVersion);
  const appVersionEnvironment = environments.find((env) => env.id === selected?.currentEnvironmentId);
  const currentEnvIndex = environments.findIndex((env) => env.id === appVersionEnvironment?.id);

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
          darkMode={darkMode}
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
        darkMode={darkMode}
        editingVersion={editingVersion}
        onClose={() => setPromoteModalData(null)}
        fetchEnvironments={() => {}}
      />
    </>
  );
};

export default withAppVersionLifecycle(PromoteVersionButton);
