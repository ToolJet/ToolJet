import React from 'react';
import { CloudCheck, CloudAlert } from 'lucide-react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { ToolTip } from '@/_components';

const SaveIndicator = ({ isSaving, saveError }) => {
  if (isSaving) {
    return (
      <ToolTip message="Saving in progress! Don't close the app yet." placement="bottom">
        <div className="d-flex align-items-center" style={{ gap: '4px' }}>
          <div className="d-flex align-items-center" style={{ width: '16px', height: '16px' }}>
            <Loader width={16} height={16} reverse={true} />
          </div>
          <p className="mb-0 mx-1 text-center tw-text-text-default">Saving...</p>
        </div>
      </ToolTip>
    );
  }
  if (saveError) {
    return (
      <ToolTip message="Could not save changes" placement="bottom">
        <div className="d-flex align-items-center" style={{ gap: '4px' }}>
          <CloudAlert width={16} height={16} color="var(--icon-danger)" />
          <p className="mb-0 text-center tw-text-text-danger">Could not save changes</p>
        </div>
      </ToolTip>
    );
  }
  return (
    <ToolTip message="Changes saved!" placement="bottom">
      <div className="d-flex align-items-center" style={{ gap: '4px' }}>
        <CloudCheck width={16} height={16} color="var(--icon-success)" />
      </div>
    </ToolTip>
  );
};

export default SaveIndicator;
