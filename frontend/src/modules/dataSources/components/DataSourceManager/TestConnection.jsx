import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { datasourceService } from '@/_services';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

export const TestConnection = ({
  kind,
  options,
  pluginId,
  onConnectionTestFailed,
  environmentId,
  dataSourceId,
  dataSourceType,
  appId,
}) => {
  const [isTesting, setTestingStatus] = useState(false);
  const { t } = useTranslation();

  function testDataSource() {
    setTestingStatus(true);
    posthogHelper.captureEvent('test_connection_datasource', { dataSource: kind, appId });
    //posthog event

    const testConnectionBody = {
      kind,
      options,
      plugin_id: pluginId,
      environment_id: environmentId,
      dataSourceId: dataSourceId,
    };
    const sampleDbTestConnection = {
      kind,
      options,
      plugin_id: pluginId,
      environment_id: environmentId,
      dataSourceId,
    };
    const body = dataSourceType === DATA_SOURCE_TYPE.SAMPLE ? sampleDbTestConnection : testConnectionBody;

    const testFunction =
      dataSourceType === DATA_SOURCE_TYPE.SAMPLE ? datasourceService.testSampleDb : datasourceService.test;
    testFunction(body).then(
      (data) => {
        setTestingStatus(false);
        if (data.status === 'ok') {
          toast.success(t('globals.testConnectionVerified', 'Test connection verified'));
        } else {
          toast.error(t('globals.testConnectionFailed', 'Test connection could not be verified'));
          onConnectionTestFailed(data);
        }
      },
      ({ error }) => {
        setTestingStatus(false);
        toast.error(t('globals.testConnectionFailed', 'Test connection could not be verified'));
        onConnectionTestFailed({ message: error || 'Connection test failed', status: 'failed' });
      }
    );
  }

  return (
    <div>
      <ButtonSolid
        disabled={isTesting}
        onClick={() => testDataSource()}
        data-cy={`test-connection-button`}
        variant="tertiary"
        leftIcon="arrowsort"
      >
        {isTesting
          ? t('globals.testingConnection', 'Testing connection...')
          : t('globals.testConnection', 'Test connection')}
      </ButtonSolid>
    </div>
  );
};
