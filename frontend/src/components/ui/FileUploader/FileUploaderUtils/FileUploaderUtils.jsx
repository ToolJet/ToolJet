import React from 'react';
import { FileTypeIcons } from './FileTypeIcons';
import { Label } from '../../Label/label';

// export const ValidationMessage = ({ response, validationMessage, className }) => (
//   <div className={cn('tw-flex tw-pl-[2px] tw-items-center tw-my-[2px]', className)}>
//     <ValidationIcon result={response} />
//     <Label
//       htmlFor="validation"
//       type="helper"
//       size="default"
//       className={`tw-font-normal ${response === 'true' ? 'tw-text-text-success' : 'tw-text-text-warning'}`}
//     >
//       {validationMessage}
//     </Label>
//   </div>
// );

export const RequiredIndicator = ({ disabled }) => (
  <span
    className={`tw-ml-[2px] tw-relative -tw-top-[1px] ${disabled ? 'tw-text-text-disabled' : 'tw-text-text-danger'}`}
  >
    *
  </span>
);

export const InputFileLabel = ({ label, helper, disabled, required }) => (
  <div className="tw-flex tw-flex-col tw-mb-[2px]">
    <Label
      htmlFor="label"
      type="label"
      size="default"
      className={`tw-font-medium tw-ml-[2px] ${disabled ? '!tw-text-text-disabled' : ''}`}
    >
      {label}
      {required && <RequiredIndicator disabled={disabled} />}
    </Label>
    {helper && (
      <Label
        htmlFor="helper"
        type="helper"
        size="default"
        className={`tw-font-normal tw-ml-[2px] ${disabled ? '!tw-text-text-disabled' : ''}`}
      >
        {helper}
      </Label>
    )}
  </div>
);

export const Constraints = ({ formats, size, disabled }) => (
  <div className="tw-flex tw-justify-between tw-pl-[2px] tw-items-center tw-mt-[2px]">
    <Label
      htmlFor="helper"
      type="helper"
      size="default"
      className={`tw-font-normal ${disabled ? '!tw-text-text-disabled' : ''}`}
    >
      Supported formats: {formats}
    </Label>
    <Label
      htmlFor="helper"
      type="helper"
      size="default"
      className={`tw-font-normal ${disabled ? '!tw-text-text-disabled' : ''}`}
    >
      Max: {size} mb
    </Label>
  </div>
);

export const FileUploadIcon = ({ isHovering, disabled }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="25" viewBox="0 0 20 25" fill="none">
      <path
        opacity="0.15"
        d="M19.1018 7.72468V23.2172C19.1018 24.1391 18.3522 24.8887 17.4303 24.8887H1.99136C1.06948 24.8887 0.319824 24.1391 0.319824 23.2172V2.29471C0.319824 1.37283 1.06948 0.623169 1.99136 0.623169H12.0003L19.1018 7.72468Z"
        fill={disabled ? 'var(--icon-disabled)' : isHovering ? 'var(--icon-disabled)' : 'var(--icon-strong)'}
      />
      <path
        opacity="0.15"
        d="M12.9675 7.45614L19.1015 12.4252V7.75499L15.6268 5.73901L12.9675 7.45614Z"
        fill={disabled ? 'var(--icon-disabled)' : 'var(--icon-strong)'}
      />
      <path
        opacity="0.9"
        d="M19.1019 7.72468H13.6719C12.7501 7.72468 12.0004 6.97502 12.0004 6.05314V0.623169L19.1019 7.72468Z"
        fill={disabled ? 'var(--icon-default)' : isHovering ? 'var(--icon-brand)' : 'var(--icon-strong)'}
      />
    </svg>
  );
};

export const UploadIcon = ({ className, isHovering, disabled }) => {
  return (
    <div className={`${className}`}>
      <div className="tw-flex-[1_0%_0%] tw-self-stretch">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="12" viewBox="0 0 11 12" fill="none">
          <ellipse
            cx="5.33333"
            cy="6.04342"
            rx="5.33333"
            ry="5.33333"
            fill={disabled ? 'var(--icon-default)' : isHovering ? 'var(--icon-accent)' : 'var(--icon-strong)'}
          />
        </svg>
      </div>
      <UploadTreyIcon className="tw-absolute tw-left-[2px] tw-top-[0.3px]" isHovering={isHovering} />
    </div>
  );
};

export const UploadTreyIcon = ({ className, isHovering }) => {
  return (
    <div className={className}>
      <svg xmlns="http://www.w3.org/2000/svg" width="7" height="7" viewBox="0 0 7 7" fill="none">
        <g clip-path="url(#clip0_7047_1838)">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3.40588 4.21491C3.60626 4.21491 3.7687 4.05248 3.7687 3.8521V1.85663H4.31292C4.38629 1.85663 4.45244 1.81244 4.48052 1.74465C4.50858 1.67686 4.49307 1.59884 4.44119 1.54696L3.53416 0.639924C3.46332 0.569081 3.34846 0.569081 3.27762 0.639924L2.37059 1.54696C2.3187 1.59884 2.30318 1.67686 2.33126 1.74465C2.35934 1.81244 2.42549 1.85663 2.49886 1.85663H3.04307V3.8521C3.04307 4.05248 3.20551 4.21491 3.40588 4.21491ZM1.77323 4.57772C1.77323 4.37734 1.61079 4.21491 1.41042 4.21491C1.21004 4.21491 1.04761 4.37734 1.04761 4.57772C1.04761 4.86638 1.16228 5.14324 1.3664 5.34736C1.57052 5.55147 1.84737 5.66616 2.13604 5.66616H4.67572C4.96441 5.66616 5.24124 5.55147 5.44536 5.34736C5.64948 5.14324 5.76416 4.86641 5.76416 4.57772C5.76416 4.37734 5.60173 4.21491 5.40135 4.21491C5.20097 4.21491 5.03854 4.37734 5.03854 4.57772C5.03854 4.67394 5.0003 4.76624 4.93227 4.83427C4.86424 4.90229 4.77194 4.94053 4.67572 4.94053H2.13604C2.03982 4.94053 1.94754 4.90229 1.87949 4.83427C1.81146 4.76624 1.77323 4.67394 1.77323 4.57772Z"
            fill={isHovering ? 'var(--icon-on-solid)' : 'var(--icon-inverse)'}
          />
        </g>
        <defs>
          <clipPath id="clip0_7047_1838">
            <rect
              width="6.09524"
              height="6.09524"
              fill={isHovering ? 'var(--icon-on-solid)' : 'var(--icon-inverse)'}
              transform="translate(0.285706 0.0788574)"
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};

export const FileTypeIcon = ({ filetype }) => {
  return (
    <div className="tw-flex tw-h-[24px] tw-w-[24px] tw-py-[2px] tw-px-[3px] tw-justify-center tw-items-center tw-shrink-0">
      <FileTypeIcons filetype={filetype} />
    </div>
  );
};

export const RemoveIcon = ({ onClick }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" onClick={onClick}>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M10.756 2.42233C11.0813 2.09695 11.0813 1.56941 10.756 1.24403C10.4306 0.918656 9.90305 0.918656 9.57769 1.24403L6.00002 4.82172L2.42233 1.24403C2.09695 0.918656 1.56941 0.918656 1.24403 1.24403C0.918656 1.56941 0.918656 2.09695 1.24403 2.42233L4.82172 6.00002L1.24403 9.57769C0.918656 9.90305 0.918656 10.4306 1.24403 10.756C1.56941 11.0813 2.09695 11.0813 2.42233 10.756L6.00002 7.17831L9.57769 10.756C9.90305 11.0813 10.4306 11.0813 10.756 10.756C11.0813 10.4306 11.0813 9.90305 10.756 9.57769L7.17831 6.00002L10.756 2.42233Z"
        fill="#6A727C"
      />
    </svg>
  );
};
