import React from 'react';

const LabeledDivider = ({ label }) => {
  return (
    <div className="tw-relative tw-py-2">
      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center">
        <div
          className="tw-w-full tw-border-t tw-border-gray-200 tw-border-dashed"
          style={{ borderColor: 'var(--border-default, #CCD1D5)', borderTop: '0px' }}
        ></div>
      </div>
      <div className="tw-relative tw-flex tw-justify-center">
        <span
          className="base-medium"
          style={{ color: 'var(--text-placeholder, #6A727C)', background: 'var(--base)', padding: '0 6px' }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

export default LabeledDivider;
