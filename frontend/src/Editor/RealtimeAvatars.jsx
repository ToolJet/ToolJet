import React from 'react';
import { useOthers } from 'y-presence';

const RealtimeAvatars = () => {
  const others = useOthers();
  return (
    <div className="row" style={{ position: 'absolute', left: '35%' }}>
      <div className="col-auto ms-auto">
        <div className="avatar-list avatar-list-stacked">
          {others.map(({ id, presence }) => {
            return (
              <span key={id} className="avatar avatar-sm avatar-rounded">
                {presence?.name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RealtimeAvatars;
