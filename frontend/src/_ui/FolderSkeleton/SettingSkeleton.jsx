import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { Spinner } from 'react-bootstrap';

export default function SettingSkeleton(props) {
  return (
    <div className={`${props.settingsPage ? '' : 'col workspace-content-wrapper'}`}>
      <div className="page-wrapper" style={{ marginTop: `${props.settingsPage ? '0' : '2rem'}` }}>
        <div className="d-block org-settings-wrapper-card custom-styles-wrapper">
          <div className="col border-bottom" style={{ padding: '1rem' }}>
            <Skeleton width={160} height={24} />
          </div>
          <>
            <div
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 270px)' }}
            >
              <Spinner variant="primary" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }} className="p-2 gap-2">
              <Skeleton width={100} height={32} />
              <Skeleton width={160} height={32} />
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
