import React from 'react';
import { useTranslation } from 'react-i18next';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import Radio from '@/_ui/Radio';

const GoogleSheetsAccessType = ({ options, optionchanged, disabled = false }) => {
  const { t } = useTranslation();
  const whiteLabelText = retrieveWhiteLabelText();

  return (
    <div className="row">
      <div className="col-md-12">
        <div className="mb-3">
          <div data-cy="google-sheet-connection-form-header" className="form-label">
            {t('globals.authorize', 'Authorize')}
          </div>
          <p
            data-cy="google-sheet-connection-form-description"
            className="text-muted"
            style={{ fontSize: '12px', marginBottom: '12px' }}
          >
            {t(
              'googleSheets.enableReadAndWrite',
              'If you want your ${whiteLabelText} apps to modify your Google sheets, make sure to select read and write access',
              { whiteLabelText }
            )}
          </p>
          <div>
            <Radio
              checked={options?.access_type?.value === 'read'}
              disabled={disabled}
              onClick={() => optionchanged('access_type', 'read')}
              text={t('googleSheets.readOnly', 'Read only')}
              helpText={t(
                'googleSheets.readDataFromSheets',
                'Your ${whiteLabelText} apps can only read data from Google sheets',
                {
                  whiteLabelText,
                }
              )}
            />
            <Radio
              checked={options?.access_type?.value === 'write'}
              disabled={disabled}
              onClick={() => optionchanged('access_type', 'write')}
              text={t('googleSheets.readWrite', 'Read and write')}
              helpText={t(
                'googleSheets.readModifySheets',
                'Your ${whiteLabelText} apps can read data from sheets, modify sheets, and more.',
                { whiteLabelText }
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsAccessType;
