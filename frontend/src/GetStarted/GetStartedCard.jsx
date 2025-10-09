import React from 'react';
import { Link } from 'react-router-dom';

export default function GetStartedCard({ children, className = '', to, ...props }) {
  const cardClass = `card !tw-bg-page-weak !tw-rounded-md tw-box-border !tw-border-border-weak hover:tw-border-border-default tw-border-solid tw-content-stretch tw-flex tw-flex-row tw-gap-2.5 tw-items-start tw-justify-start tw-p-4 tw-relative tw-w-72 ${className}`;
  if (to) {
    return (
      <Link to={to} className={cardClass} {...props} style={{ textDecoration: 'none' }}>
        {children}
      </Link>
    );
  }
  return (
    <div className={cardClass} {...props}>
      {children}
    </div>
  );
}
