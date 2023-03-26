import React from 'react';

const NotificationUnread = ({ fill = '#C1C8CD', width = '25', className = '', viewBox = '0 0 25 25' }) => (
  <svg
    className={className}
    width={width}
    height={width}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 21C13.385 21 14.5633 20.1652 15 19H9C9.43668 20.1652 10.615 21 12 21Z" fill={fill} />
    <path
      opacity="0.4"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.6896 3.75403C13.274 3.29116 12.671 3 12 3C10.7463 3 9.73005 4.01629 9.73005 5.26995V5.37366C7.58766 6.10719 6.0016 7.85063 5.76046 9.97519L5.31328 13.9153C5.23274 14.6249 4.93344 15.3016 4.44779 15.8721C3.35076 17.1609 4.39443 19 6.22281 19H17.7772C19.6056 19 20.6492 17.1609 19.5522 15.8721C19.0666 15.3016 18.7673 14.6249 18.6867 13.9153L18.2395 9.97519C18.2333 9.92024 18.2262 9.86556 18.2181 9.81113C17.8341 9.93379 17.4248 10 17 10C14.7909 10 13 8.20914 13 6C13 5.16744 13.2544 4.3943 13.6896 3.75403Z"
      fill={fill}
    />
    <circle cx="17" cy="6" r="3" fill={fill} />
  </svg>
);

export default NotificationUnread;
