import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import { datasourceService } from '@/_services';

export const TestConnection = ({ kind, options, onConnectionTestFailed }) => {
  const [isTesting, setTestingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [buttonText, setButtonText] = useState('Test Connection');

  useEffect(() => {
    if (isTesting) {
      setButtonText('Testing connection...');
    } else if (!isTesting && connectionStatus === 'success') {
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

    datasourceService.test(kind, options).then(
      (data) => {
        setTestingStatus(false);
        if(data.status === 'ok') {
          setConnectionStatus('success');
        } else {
          setConnectionStatus('failed');
          onConnectionTestFailed(data);
        }
      },
      ({error}) => {
        setTestingStatus(false);
        setConnectionStatus('failed');
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      }
    );
  }

  return (
    <div>
      {connectionStatus === 'failed' && <span className="badge bg-red-lt">could not connect</span>}

      {connectionStatus === 'success' && <span className="badge bg-green-lt">connection verified</span>}

      {connectionStatus === 'unknown' && (
        <Button
          className="m-2"
          variant="success"
          disabled={isTesting || (!isTesting && !(connectionStatus !== 'success'))}
          onClick={testDataSource}
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
};
