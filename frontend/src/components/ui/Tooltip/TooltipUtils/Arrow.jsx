import React from 'react';

export const Arrow = ({ side, theme }) => {
  switch (side) {
    case 'Bottom Center':
      return <BottomCenterArrow theme={theme} />;
    case 'Bottom Left':
      return <BottomLeftArrow theme={theme} />;
    case 'Bottom Right':
      return <BottomRightArrow theme={theme} />;
    case 'Top Center':
      return <TopCenterArrow theme={theme} />;
    case 'Left':
      return <LeftArrow theme={theme} />;
    case 'Right':
      return <RightArrow theme={theme} />;
    default:
      return <TopCenterArrow theme={theme} />;
  }
};

export const BottomRightArrow = ({ theme }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="9"
      viewBox="0 0 28 9"
      fill="none"
      className="tw-h-[6px] tw-w-[28px] tw-shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)]"
    >
      <path
        d="M14.0711 0.485289C14.962 0.485289 15.4081 1.56243 14.7782 2.1924L8.70711 8.26347C8.31658 8.654 7.68342 8.654 7.29289 8.26347L1.22183 2.1924C0.591867 1.56243 1.03803 0.485289 1.92894 0.485289L14.0711 0.485289Z"
        fill={(theme === 'light' && '#FFFFFF') || (theme === 'dark' && '#11181C')}
      />
    </svg>
  );
};

export const BottomCenterArrow = ({ theme }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="9"
      viewBox="0 0 17 9"
      fill="none"
      className="tw-h-[6px] tw-w-[16px] tw-shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)]"
    >
      <path
        d="M14.5711 0.485289C15.462 0.485289 15.9081 1.56243 15.2782 2.1924L9.20711 8.26347C8.81658 8.654 8.18342 8.654 7.79289 8.26347L1.72183 2.1924C1.09187 1.56243 1.53803 0.485289 2.42894 0.485289L14.5711 0.485289Z"
        fill={(theme === 'light' && '#FFFFFF') || (theme === 'dark' && '#11181C')}
      />
    </svg>
  );
};

export const BottomLeftArrow = ({ theme }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="9"
      viewBox="0 0 28 9"
      fill="none"
      className="tw-h-[6px] tw-w-[28px] tw-shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)]"
    >
      <path
        d="M26.0711 0.485289C26.962 0.485289 27.4081 1.56243 26.7782 2.1924L20.7071 8.26347C20.3166 8.654 19.6834 8.654 19.2929 8.26347L13.2218 2.1924C12.5919 1.56243 13.038 0.485289 13.9289 0.485289L26.0711 0.485289Z"
        fill={(theme === 'light' && '#FFFFFF') || (theme === 'dark' && '#11181C')}
      />
    </svg>
  );
};

export const TopCenterArrow = ({ theme }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="9"
      viewBox="0 0 17 9"
      fill="none"
      className="tw-h-[6px] tw-w-[16px] tw-shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)]"
    >
      <path
        d="M2.42894 8.51471C1.53803 8.51471 1.09187 7.43757 1.72183 6.8076L7.79289 0.736529C8.18342 0.346004 8.81658 0.346005 9.20711 0.736529L15.2782 6.8076C15.9081 7.43757 15.462 8.51471 14.5711 8.51471L2.42894 8.51471Z"
        fill={(theme === 'light' && '#FFFFFF') || (theme === 'dark' && '#11181C')}
      />
    </svg>
  );
};

export const LeftArrow = ({ theme }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="9"
      height="16"
      viewBox="0 0 9 16"
      fill="none"
      className="tw-h-[16px] tw-w-[6px] tw-shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)]"
    >
      <path
        d="M8.51471 14.0711C8.51471 14.962 7.43757 15.4081 6.8076 14.7782L0.736529 8.7071C0.346004 8.31658 0.346005 7.68342 0.736529 7.29289L6.8076 1.22183C7.43757 0.591867 8.51471 1.03803 8.51471 1.92894L8.51471 14.0711Z"
        fill={(theme === 'light' && '#FFFFFF') || (theme === 'dark' && '#11181C')}
      />
    </svg>
  );
};

export const RightArrow = ({ theme }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="6"
      height="16"
      viewBox="0 0 6 16"
      fill="none"
      className="tw-h-[16px] tw-w-[6px] tw-shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)]"
    >
      <g clip-path="url(#clip0_182_47322)">
        <path
          d="M-2.51471 1.92894C-2.51471 1.03803 -1.43757 0.591868 -0.807603 1.22183L5.26347 7.29289C5.654 7.68342 5.654 8.31658 5.26347 8.70711L-0.807603 14.7782C-1.43757 15.4081 -2.51471 14.962 -2.51471 14.0711L-2.51471 1.92894Z"
          fill={(theme === 'light' && '#FFFFFF') || (theme === 'dark' && '#11181C')}
        />
      </g>
      <defs>
        <clipPath id="clip0_182_47322">
          <rect
            width="16"
            height="6"
            fill={(theme === 'light' && '#FFFFFF') || (theme === 'dark' && '#11181C')}
            transform="matrix(0 -1 1 0 0 16)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};
