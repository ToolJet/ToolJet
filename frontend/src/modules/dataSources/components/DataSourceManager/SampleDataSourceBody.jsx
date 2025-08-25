import React from 'react';

import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export default function SampleDataSourceBody({
  darkMode,
  isCreatingSampleApp,
  isVersionReleased,
  onCreateSampleApp,
  showCreateSampleAppBtn = true,
}) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-base tw-font-normal tw-text-text-default tw-h-full">
      <p className="tw-text-center tw-max-w-96">
        This is a sample PostgreSQL data source which is included in your workspace by default to help you explore
        ToolJet&apos;s capabilities. If you don&apos;t have your own data source connected yet but want to get started
        right away, this is perfect for testing and learning.
      </p>

      <p className="tw-text-center tw-max-w-96">
        Please note: this is a shared resource that may display varying data due to real-time updates from other users.
        It&apos;s intended for exploration only, not production use.
      </p>

      {showCreateSampleAppBtn && (
        <ButtonSolid
          className={`create-app-btn`}
          data-cy="create-sample-app-button"
          isLoading={isCreatingSampleApp}
          variant="primary"
          onClick={onCreateSampleApp}
          fill={darkMode && isVersionReleased ? '#4c5155' : '#FDFDFE'}
        >
          Create sample application
        </ButtonSolid>
      )}
    </div>
  );
}
