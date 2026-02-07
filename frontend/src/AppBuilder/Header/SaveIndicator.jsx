import React from 'react';
import { CloudCheck, CloudAlert } from 'lucide-react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { ToolTip } from '@/_components';
import { useTranslation } from 'react-i18next';

const SaveIndicator = ({ isSaving, saveError }) => {
  const { t } = useTranslation();
  if (isSaving) {
    return (
      <ToolTip message={t('editor.saveIndicator.savingTooltip', "Saving in progress! Don't close the app yet.")} placement="bottom">
        <div className="d-flex align-items-center" style={{ gap: '4px' }}>
          <div className="d-flex align-items-center" style={{ width: '16px', height: '16px' }}>
            <Loader width={16} height={16} reverse={true} />
          </div>
          <p className="mb-0 mx-1 text-center tw-text-text-default">
            {t('globals.saving', 'Saving...')}
          </p>
        </div>
      </ToolTip>
    );
  }
  if (saveError) {
    return (
      <ToolTip message={t('editor.saveIndicator.saveErrorTooltip', 'Could not save changes')} placement="bottom">
        <div className="d-flex align-items-center" style={{ gap: '4px' }}>
          <CloudAlert width={16} height={16} color="var(--icon-danger)" />
          <p className="mb-0 text-center tw-text-text-danger">
            {t('editor.saveIndicator.saveError', 'Could not save changes')}
          </p>
        </div>
      </ToolTip>
    );
  }
  return (
    <ToolTip message={t('editor.saveIndicator.savedTooltip', 'Changes saved!')} placement="bottom">
      <div className="d-flex align-items-center" style={{ gap: '4px' }}>
        <CloudCheck width={16} height={16} color="var(--icon-success)" />
      </div>
    </ToolTip>
  );
};

export default SaveIndicator;
