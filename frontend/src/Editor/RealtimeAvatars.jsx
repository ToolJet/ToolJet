import React from 'react';
import { useOthers } from 'y-presence';

const MAX_DISPLAY_USERS = 5;
const RealtimeAvatars = ({ self, updatePresence, editingVersionId }) => {
  const others = useOthers();
  const othersOnSameEditingVersion = others.filter((other) => other?.presence?.editingVersionId === editingVersionId);

  React.useEffect(() => {
    updatePresence({ editingVersionId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingVersionId]);

  console.log('hello', self);

  return (
    <div className="row" style={{ position: 'absolute', left: '35%' }}>
      <div className="col-auto ms-auto">
        <div className="avatar-list avatar-list-stacked">
          {self.presence && (
            <span
              style={{ border: `1px solid ${self.presence.color}` }}
              key={self.presence.id}
              className="avatar avatar-sm avatar-rounded"
            >
              {self.presence?.name}
            </span>
          )}
          {othersOnSameEditingVersion.slice(0, MAX_DISPLAY_USERS).map(({ id, presence }) => {
            return (
              <span
                key={id}
                style={{ border: `1px solid ${presence.color}` }}
                className="avatar avatar-sm avatar-rounded"
              >
                {presence?.name}
              </span>
            );
          })}
          {othersOnSameEditingVersion.length > MAX_DISPLAY_USERS && (
            <span style={{ border: `1px solid` }} className="avatar avatar-sm avatar-rounded">
              +{othersOnSameEditingVersion.length - MAX_DISPLAY_USERS}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeAvatars;
