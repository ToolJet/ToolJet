import React from 'react';
import { CloudCheck, CloudAlert, LoaderCircle } from 'lucide-react';

const SaveIndicator = ({ isSaving, saveError }) => {
  if (isSaving) {
    return (
      <div
        className="d-flex align-items-center"
        style={{ gap: '4px' }}
        data-tooltip-id="editor-header-tooltip"
        data-tooltip-content="Saving in progress! Don't close the app yet."
      >
        <LoaderCircle width={16} height={16} className="tw-animate-spin" />
        <p className="mb-0 text-center tw-text-text-default">Saving...</p>
      </div>
    );
  }
  if (saveError) {
    return (
      <div
        className="d-flex align-items-center"
        style={{ gap: '4px' }}
        data-tooltip-id="editor-header-tooltip"
        data-tooltip-content="Could not save changes"
      >
        <CloudAlert width={16} height={16} color="var(--icon-danger)" />
        <p className="mb-0 text-center tw-text-text-danger">Could not save changes</p>
      </div>
    );
  }
  return (
    <div
      className="d-flex align-items-center"
      style={{ gap: '4px' }}
      data-tooltip-id="editor-header-tooltip"
      data-tooltip-content="Changes saved!"
    >
      <CloudCheck width={16} height={16} color="var(--icon-success)" />
    </div>
  );
};

export default SaveIndicator;
