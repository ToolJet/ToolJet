import React from 'react';
import { useTranslation } from 'react-i18next';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

export default function SuccessNotificationInputs({ currentState, options, darkMode, optionchanged }) {
  const { t } = useTranslation();
  if (!options?.showSuccessNotification) {
    return <div className="mb-3"></div>;
  }
  return (
    <div className="me-4 mb-3 mt-2 pt-1" style={{ paddingLeft: '112px' }}>
      <div className="d-flex">
        <label className="form-label" data-cy={'label-success-message-input'} style={{ width: 150 }}>
          {t('editor.queryManager.successMessage', 'Message')}
        </label>
        <div className="flex-grow-1">
          <CodeHinter
            currentState={currentState}
            initialValue={options.successMessage}
            height="36px"
            theme={darkMode ? 'monokai' : 'default'}
            onChange={(value) => optionchanged('successMessage', value)}
            placeholder={t('editor.queryManager.queryRanSuccessfully', 'Query ran successfully')}
            cyLabel={'success-message'}
          />
        </div>
      </div>
      <div className="d-flex">
        <label className="form-label" data-cy={'label-notification-duration-input'} style={{ width: 150 }}>
          {t('editor.queryManager.notificationDuration', 'duration (s)')}
        </label>
        {/* </div> */}
        <div className="flex-grow-1 query-manager-input-elem">
          <input
            type="number"
            disabled={!options.showSuccessNotification}
            onChange={(e) => optionchanged('notificationDuration', e.target.value)}
            placeholder={5}
            className="form-control"
            value={options.notificationDuration}
            data-cy={'notification-duration-input-field'}
          />
        </div>
      </div>
    </div>
  );
}
