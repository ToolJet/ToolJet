import React from 'react';

export function Loader() {
  return (
    <div className="card sso-page-loader-card">
      <div className="card-header">
        <div className="card-title">
          <div className="skeleton-avatar"></div>
        </div>
      </div>
      <div className="card-body">
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
      </div>
    </div>
  );
}
