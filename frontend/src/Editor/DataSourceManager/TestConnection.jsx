import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { datasourceService } from '@/_services';
import { useTranslation } from 'react-i18next';

export const TestConnection = ({ kind, options, pluginId, onConnectionTestFailed, darkMode }) => {
  const [isTesting, setTestingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [buttonText, setButtonText] = useState('Test Connection');
  const { t } = useTranslation();

  useEffect(() => {
    if (isTesting) {
      setButtonText('Testing connection...');
    } else if (connectionStatus === 'success') {
      setButtonText('Connection verified');
    } else {
      setButtonText('Test Connection');
    }
  }, [isTesting, connectionStatus]);

  useEffect(() => {
    setConnectionStatus('unknown');
  }, [options]);

  function testDataSource() {
    setTestingStatus(true);

    datasourceService.test(kind, options, pluginId).then(
      (data) => {
        setTestingStatus(false);
        if (data.status === 'ok') {
          setConnectionStatus('success');
        } else {
          setConnectionStatus('failed');
          onConnectionTestFailed(data);
        }
      },
      ({ error }) => {
        setTestingStatus(false);
        setConnectionStatus('failed');
        toast.error(error, { position: 'top-center' });
      }
    );
  }

  return (
    <div>
      {connectionStatus === 'failed' && (
        <span className="badge bg-red-lt" data-cy={`test-connection-failed-text`}>{t('globals.noConnection', 'could not connect')}</span>
      )}

      {connectionStatus === 'success' && (
        <span className="badge bg-green-lt" data-cy={`test-connection-verified-text`}>{t('globals.connectionVerified', 'connection verified')}</span>
      )}

      {connectionStatus === 'unknown' && (
        <button
          className={`datasource-modal-button ${darkMode && 'dark-button'}`}
          disabled={isTesting || connectionStatus === 'success'}
          onClick={testDataSource}
          data-cy={`test-connection-button`}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};
