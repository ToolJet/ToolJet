import React from 'react';

const VersionItemSkeleton = () => {
  return (
    <div
      className="version-item-skeleton"
      style={{
        padding: '6px 4px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div className="d-flex align-items-start" style={{ gap: '8px' }}>
        {/* Check icon placeholder */}
        <div
          style={{
            width: '16px',
            height: '16px',
            flexShrink: 0,
            backgroundColor: 'var(--slate3)',
            borderRadius: '50%',
          }}
        />

        {/* Content */}
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          {/* Version name and tag */}
          <div className="d-flex align-items-center" style={{ gap: '8px', marginBottom: '4px' }}>
            {/* Name skeleton */}
            <div
              style={{
                width: '80px',
                height: '16px',
                backgroundColor: 'var(--slate3)',
                borderRadius: '4px',
              }}
            />
            {/* Tag skeleton */}
            <div
              style={{
                width: '40px',
                height: '18px',
                backgroundColor: 'var(--slate3)',
                borderRadius: '4px',
              }}
            />
          </div>

          {/* Description skeleton */}
          <div
            style={{
              width: '120px',
              height: '12px',
              backgroundColor: 'var(--slate3)',
              borderRadius: '4px',
              marginBottom: '4px',
            }}
          />

          {/* Metadata skeleton */}
          <div
            style={{
              width: '90px',
              height: '12px',
              backgroundColor: 'var(--slate3)',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default VersionItemSkeleton;
