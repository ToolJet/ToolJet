import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import './ConfirmationInputs.scss';

// Rendered under the "Show notification on success" toggle, indented like the confirmation inputs.
export default function SuccessNotificationInputs({ options, optionchanged }) {
  const { t } = useTranslation();
  if (!options?.showSuccessNotification) return null;

  return (
    <div className="confirmation-inputs">
      <div data-param="successMessage" className="confirmation-message-row">
        <label className="form-label align-items-center" data-cy="label-success-message-input" style={{ width: 132 }}>
          {t('editor.queryManager.successMessage', 'Message')}
        </label>
        <div className="flex-grow-1" style={{ maxWidth: '530px' }}>
          <CodeHinter
            type="basic"
            initialValue={options.successMessage}
            onChange={(value) => optionchanged('successMessage', value)}
            placeholder={t('editor.queryManager.queryRanSuccessfully', 'Query ran successfully')}
            cyLabel="success-message"
          />
        </div>
      </div>
      <div data-param="notificationDuration" className="confirmation-message-row">
        <label
          className="form-label align-items-center"
          data-cy="label-notification-duration-input"
          style={{ width: 132 }}
        >
          {t('editor.queryManager.notificationDuration', 'duration (s)')}
        </label>
        <div className="flex-grow-1 query-manager-input-elem" style={{ maxWidth: '530px' }}>
          <input
            type="number"
            onChange={(e) => optionchanged('notificationDuration', e.target.value)}
            placeholder={5}
            className="form-control"
            value={options.notificationDuration}
            data-cy="notification-duration-input-field"
          />
        </div>
      </div>
    </div>
  );
}
