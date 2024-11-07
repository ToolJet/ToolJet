import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/Editor/CodeEditor';

export default function SuccessNotificationInputs({ currentState, options, darkMode, optionchanged }) {
  const { t } = useTranslation();
  if (!options?.showSuccessNotification) {
    return <div className="mb-3"></div>;
  }
  return (
    <div className="flex-grow-1" style={{ margin: '16px 0px' }}>
      <div className="d-flex" style={{ marginBottom: '16px' }}>
        <label className="form-label align-items-center" data-cy={'label-success-message-input'} style={{ width: 150 }}>
          {t('editor.queryManager.successMessage', 'Message')}
        </label>
        <div className="flex-grow-1" style={{ maxWidth: '460px' }}>
          <CodeHinter
            type="basic"
            initialValue={options.successMessage}
            onChange={(value) => optionchanged('successMessage', value)}
            placeholder={t('editor.queryManager.queryRanSuccessfully', 'Query ran successfully')}
            cyLabel={'success-message'}
          />
        </div>
      </div>
      <div className="d-flex">
        <label
          className="form-label align-items-center"
          data-cy={'label-notification-duration-input'}
          style={{ width: 150 }}
        >
          {t('editor.queryManager.notificationDuration', 'duration (s)')}
        </label>
        <div className="flex-grow-1 query-manager-input-elem" style={{ maxWidth: '460px' }}>
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
