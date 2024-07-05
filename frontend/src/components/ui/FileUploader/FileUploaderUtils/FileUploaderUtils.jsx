import React from 'react';
import { FileTypeIcons } from './FileTypeIcons';
import { Label } from '../../Label/Label';

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

export const ProgressBar = ({ progress }) => {
  return (
    <div className="tw-w-full tw-bg-border-weak tw-rounded-full tw-h-[4px] tw-mt-[4px]">
      <div
        className="tw-bg-border-accent-strong tw-h-[4px] tw-rounded-full tw-transition-width tw-duration-300 tw-ease-in-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export const RetryIcon = ({ onClick }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" onClick={onClick}>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M5.12859 2.6108C6.58086 2.23763 8.07138 2.81711 8.88607 4.00006L5.12859 2.6108ZM8.88607 4.00006H7.50003C7.22389 4.00006 7.00003 4.22392 7.00003 4.50006C7.00003 4.7762 7.22389 5.00006 7.50003 5.00006H9.70517C9.71283 5.00024 9.7205 5.00024 9.72819 5.00006H10C10.2762 5.00006 10.5 4.7762 10.5 4.50006V2.00006C10.5 1.72392 10.2762 1.50006 10 1.50006C9.72389 1.50006 9.50003 1.72392 9.50003 2.00006V3.15219C8.41633 1.81719 6.62138 1.19467 4.87958 1.6423L4.87947 1.64232C4.08832 1.84583 3.36748 2.26086 2.79427 2.8429C2.22106 3.42494 1.8171 4.15204 1.62572 4.94621C1.43434 5.74039 1.46275 6.57168 1.70791 7.35094C1.95307 8.13019 2.40573 8.82801 3.01735 9.36956C3.62896 9.91111 4.37645 10.2759 5.17966 10.425C5.98286 10.574 6.81148 10.5015 7.57664 10.2154C8.3418 9.92927 9.01464 9.44025 9.523 8.80079C10.0314 8.16133 10.3561 7.39555 10.4623 6.58557C10.4982 6.31177 10.3053 6.06071 10.0315 6.0248C9.75775 5.9889 9.50668 6.18175 9.47078 6.45555C9.38816 7.08553 9.13561 7.68114 8.74022 8.17849C8.34483 8.67585 7.82151 9.0562 7.22638 9.27875C6.63126 9.50129 5.98678 9.55763 5.36206 9.44174C4.73735 9.32584 4.15597 9.04207 3.68027 8.62087C3.20457 8.19967 2.8525 7.65692 2.66182 7.05083C2.47114 6.44474 2.44904 5.79818 2.59789 5.18049C2.74675 4.5628 3.06093 3.99728 3.50676 3.54458C3.95257 3.0919 4.51318 2.76911 5.12848 2.61082"
        fill="#6A727C"
      />
    </svg>
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
