/* eslint-disable import/no-unresolved */
import React from 'react';
import config from 'config';
import Avatar from '@/_ui/Avatar';
import { useOthers } from 'y-presence';

const MAX_DISPLAY_USERS = 3;
const RealtimeAvatars = ({ self, updatePresence, editingVersionId }) => {
  const others = useOthers();
  const othersOnSameVersion = others.filter((other) => other?.presence?.editingVersionId === editingVersionId);

  React.useEffect(() => {
    updatePresence({ editingVersionId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingVersionId]);

  const getAvatarText = (presence) => presence.firstName?.charAt(0) + presence.lastName?.charAt(0);
  const getAvatarTitle = (presence) => `${presence.firstName} ${presence.lastName}`;

  return (
    <div className="row realtime-avatars">
      <div className="col-auto ms-auto">
        <div className="avatar-list avatar-list-stacked">
          {self.presence && (
            <Avatar
              key={self?.presence?.id}
              borderColor={self?.presence?.color}
              title={getAvatarTitle(self?.presence)}
              text={getAvatarText(self?.presence)}
            />
          )}
          {othersOnSameVersion.slice(0, MAX_DISPLAY_USERS).map(({ id, presence }) => {
            return (
              <Avatar
                key={id}
                borderColor={presence.color}
                title={getAvatarTitle(presence)}
                text={getAvatarText(presence)}
              />
            );
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
