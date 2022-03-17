import React from 'react';
import { useOthers } from 'y-presence';

const MAX_DISPLAY_USERS = 5;
const RealtimeAvatars = ({ self }) => {
  const others = useOthers();

  return (
    <div className="row" style={{ position: 'absolute', left: '35%' }}>
      <div className="col-auto ms-auto">
        <div className="avatar-list avatar-list-stacked">
          {self.presence && (
            <span key={self.presence.id} className="avatar avatar-sm avatar-rounded">
              {self.presence?.name}
            </span>
          )}
          {others.slice(0, MAX_DISPLAY_USERS).map(({ id, presence }) => {
            return (
              <span key={id} className="avatar avatar-sm avatar-rounded">
                {presence?.name}
              </span>
            );
          })}
          {others.length > MAX_DISPLAY_USERS && (
            <span className="avatar avatar-sm avatar-rounded">+{others.length - MAX_DISPLAY_USERS}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeAvatars;
