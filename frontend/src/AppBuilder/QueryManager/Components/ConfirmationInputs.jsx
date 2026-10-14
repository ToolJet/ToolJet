import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import './ConfirmationInputs.scss';

export default function ConfirmationInputs({ options, darkMode, optionchanged, queryName }) {
  const { t } = useTranslation();
  const fxMode = !!options?.requestConfirmationFx;
  const toggleOn = !fxMode && !!options?.requestConfirmation;

  if (!fxMode && !toggleOn) return null;

  const fxValue = typeof options?.requestConfirmation === 'string' ? options.requestConfirmation : '';

  return (
    <div className="confirmation-inputs">
      {fxMode && (
        <div className="confirmation-fx-input">
          <CodeHinter
            type="basic"
            initialValue={fxValue}
            onChange={(value) => optionchanged('requestConfirmation', value)}
            placeholder="{{}}"
            cyLabel="confirmation-fx-expression"
          />
        </div>
      )}
      <div className="confirmation-message-row">
        <label
          className="form-label align-items-center"
          data-cy="label-confirmation-message-input"
          style={{ width: 132 }}
        >
          {t('editor.queryManager.confirmationMessage', 'Confirmation message')}
        </label>
        <div className="flex-grow-1" style={{ maxWidth: '530px' }}>
          <CodeHinter
            type="basic"
            initialValue={options?.confirmationMessage ?? ''}
            onChange={(value) => optionchanged('confirmationMessage', value)}
            placeholder={t(
              'editor.queryManager.confirmationMessagePlaceholder',
              `Do you want to run this query - ${queryName ?? ''}?`
            )}
            cyLabel="confirmation-message"
          />
        </div>
      </div>
    </div>
  );
}
