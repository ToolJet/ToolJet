import React from 'react';

const TagsTypeIcon = ({ fill = '#ACB2B9', width = '16', className = '', viewBox = '0 0 16 16', style, height }) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.33398 11.0618V13.1027C1.33398 13.9482 2.01937 14.6336 2.86483 14.6336H10.0769C10.5001 14.6336 10.9043 14.4584 11.1938 14.1497L14.3913 10.739C14.7593 10.3465 14.7593 9.7356 14.3913 9.34303L13.8315 8.746L11.9383 10.7655C11.456 11.28 10.7822 11.5719 10.0769 11.5719H2.86483C2.29046 11.5719 1.76041 11.382 1.33398 11.0618Z"
      fill={fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.86483 1.36621C2.01937 1.36621 1.33398 2.05159 1.33398 2.89706V9.02045C1.33398 9.86592 2.01937 10.5513 2.86483 10.5513H10.0769C10.5001 10.5513 10.9043 10.3762 11.1938 10.0675L14.3913 6.65676C14.7593 6.26419 14.7593 5.65332 14.3913 5.26075L11.1938 1.85005C10.9043 1.54135 10.5001 1.36621 10.0769 1.36621H2.86483Z"
      fill={fill}
    />
  </svg>
);

export default TagsTypeIcon;
