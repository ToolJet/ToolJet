import React from 'react';

const Bone = ({ style }) => <div className="version-item-skeleton__bone" style={style} />;

// Mirrors VersionDropdownItem's layout: selection tick, name, metadata line.
const VersionItemSkeleton = () => {
  return (
    <div className="version-item-skeleton" data-cy="version-item-skeleton">
      <Bone style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '1px' }} />
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <Bone style={{ width: '72px', height: '12px', margin: '3px 0 7px' }} />
        <Bone style={{ width: '148px', height: '10px' }} />
      </div>
    </div>
  );
};

export default VersionItemSkeleton;
