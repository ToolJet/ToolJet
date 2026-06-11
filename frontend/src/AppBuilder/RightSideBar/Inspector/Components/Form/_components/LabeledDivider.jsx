import React from 'react';

const LabeledDivider = ({ label, rightContentCount = 0 }) => {
  return (
    <div className="tw-relative tw-flex-1" style={{ paddingTop: 4, paddingBottom: 8 }}>
      {/* Background line */}
      <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-w-full">
        <div
          className="tw-w-full"
          style={{
            borderTop: '1px dashed var(--border-default, #CCD1D5)',
            height: '1px',
          }}
        ></div>
      </div>

      {/* Label container - centered accounting for right content */}
      <div
        className="tw-relative tw-flex tw-w-full"
        style={{
          justifyContent: 'center',
        }}
      >
        <span
          className="base-medium tw-px-3"
          style={{
            color: 'var(--text-placeholder, #6A727C)',
            background: 'var(--base)',
            transform: rightContentCount ? `translateX(${rightContentCount * 11.5}px)` : 'none', // Adjust for typical icon width + gap
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

export default LabeledDivider;
