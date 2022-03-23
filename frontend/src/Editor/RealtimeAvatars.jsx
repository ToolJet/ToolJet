import React from 'react';
import Avatar from '@/_ui/Avatar';
import { useOthers } from 'y-presence';

const MAX_DISPLAY_USERS = 5;
const RealtimeAvatars = ({ self, updatePresence, editingVersionId }) => {
  const others = useOthers();
  const othersOnSameVersion = others.filter((other) => other?.presence?.editingVersionId === editingVersionId);

  React.useEffect(() => {
    updatePresence({ editingVersionId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingVersionId]);

  return (
    <div className="row realtime-avatars">
      <div className="col-auto ms-auto">
        <div className="avatar-list avatar-list-stacked">
          {self.presence && (
            <Avatar key={self?.presence?.id} borderColor={self?.presence?.color} text={self?.presence?.name} />
          )}
          {othersOnSameVersion.slice(0, MAX_DISPLAY_USERS).map(({ id, presence }) => {
            return <Avatar key={id} borderColor={presence.color} text={presence?.name} />;
          })}
          {othersOnSameVersion.length > MAX_DISPLAY_USERS && (
            <Avatar text={`+${othersOnSameVersion.length - MAX_DISPLAY_USERS}`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeAvatars;
