import React from 'react';

export default ({ fill = '#EFB82D', unselected = '#ACB2B9' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <g clip-path="url(#clip0_278_12770)">
        <path
          opacity="0.5"
          d="M10.4878 2.3492V17.1675C10.3021 17.1817 10.1307 17.1109 9.9878 16.9834L2.13065 9.77254C2.13065 9.77254 2.11637 9.75837 2.11637 9.7442C-0.355062 7.2792 0.244938 3.69504 2.23065 1.7117C3.23065 0.70587 4.63065 0.0683703 6.21637 0.167537C7.61637 0.266704 9.07351 0.96087 10.4735 2.3492H10.4878Z"
          fill={fill}
          className="show-opacity-on-hover"
        />
        <path
          d="M18.8309 9.75836H18.8166L10.9595 16.9834C10.8309 17.1109 10.6595 17.1675 10.488 17.1675V2.34919C11.888 0.975027 13.3452 0.295028 14.7452 0.195861C16.3309 0.0825275 17.7309 0.720028 18.7452 1.72586C20.7452 3.70919 21.3452 7.29336 18.8309 9.75836Z"
          fill={unselected}
        />
      </g>
      <defs>
        <clipPath id="clip0_278_12770">
          <rect width="20" height="17" fill="white" transform="translate(0.488037 0.167542)" />
        </clipPath>
      </defs>
    </svg>
  );
};
