import React from 'react';
import ReactTooltip from 'react-tooltip';
import Avatar from '@/_ui/Avatar';
import { useOthers, useSelf } from '@y-presence/react';

const MAX_DISPLAY_USERS = 3;
const RealtimeAvatars = () => {
  const self = useSelf();
  const others = useOthers();
  const othersOnSameVersionAndPage = others.filter(
    (other) =>
      other?.presence?.editingVersionId === self?.presence.editingVersionId &&
      other?.presence?.editingPageId === self?.presence.editingPageId
  );

  const getAvatarText = (presence) => presence.firstName?.charAt(0) + presence.lastName?.charAt(0);
  const getAvatarTitle = (presence) => `${presence.firstName} ${presence.lastName}`;

  // This is required for the tooltip not binding to dynamic content
  // i.e. when others on the same version changes, tooltip
  // ref: https://github.com/wwayne/react-tooltip#3-tooltip-not-binding-to-dynamic-content
  React.useEffect(() => {
    ReactTooltip.rebuild();
  }, [othersOnSameVersionAndPage?.length]);

  return (
    <div className="row realtime-avatars">
      <div className="col-auto ms-auto">
        <div className="avatar-list avatar-list-stacked">
          {self?.presence && (
            <Avatar
              key={self?.presence?.id}
              borderColor={self?.presence?.color}
              title={getAvatarTitle(self?.presence)}
              text={getAvatarText(self?.presence)}
              image={self?.presence?.image}
              borderShape="rounded"
            />
          )}
          {othersOnSameVersionAndPage.slice(0, MAX_DISPLAY_USERS).map(({ id, presence }) => {
            return (
              <Avatar
                key={id}
                borderColor={presence.color}
                title={getAvatarTitle(presence)}
                text={getAvatarText(presence)}
                image={presence?.image}
                borderShape="rounded"
              />
            );
          })}
          {othersOnSameVersionAndPage.length > MAX_DISPLAY_USERS && (
            <Avatar text={`+${othersOnSameVersionAndPage.length - MAX_DISPLAY_USERS}`} borderShape="rounded" />
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeAvatars;
