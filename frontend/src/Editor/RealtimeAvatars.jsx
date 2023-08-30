import React from 'react';
import Popover from '@/_ui/Popover';
import Avatar from '@/_ui/Avatar';
// eslint-disable-next-line import/no-unresolved
import { useOthers, useSelf } from '@y-presence/react';

const MAX_DISPLAY_USERS = 2;
const RealtimeAvatars = ({ darkMode }) => {
  const self = useSelf();
  const others = useOthers();
  const othersOnSameVersionAndPage = others.filter(
    (other) =>
      other?.presence?.editingVersionId === self?.presence.editingVersionId &&
      other?.presence?.editingPageId === self?.presence.editingPageId
  );

  const getAvatarText = (presence) => presence.firstName?.charAt(0) + presence.lastName?.charAt(0);
  const getAvatarTitle = (presence) => `${presence.firstName} ${presence.lastName}`;

  const popoverContent = () => {
    return othersOnSameVersionAndPage
      .slice(MAX_DISPLAY_USERS, othersOnSameVersionAndPage.length)
      .map(({ id, presence }) => {
        return (
          <div key={id} className="list-group">
            <div className="list-group-item border-0">
              <div className="row align-items-center">
                <div className="col-auto">
                  <Avatar
                    borderColor={presence.color}
                    title={getAvatarTitle(presence)}
                    text={getAvatarText(presence)}
                    image={presence?.image}
                    borderShape="rounded"
                    indexId={id}
                    realtime={true}
                  />
                </div>
                <div className={`col text-truncate ${darkMode && 'text-white'}`}>
                  {getAvatarTitle(presence)}
                  <div className={`d-block ${darkMode ? 'text-light' : 'text-muted'}  text-truncate mt-n1`}>
                    {presence.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      });
  };

  return (
    <div className="row realtime-avatars">
      <div className="col-auto ms-auto d-flex align-items-center">
        <div className="avatar-list-stacked">
          {othersOnSameVersionAndPage.length > MAX_DISPLAY_USERS && (
            <Popover fullWidth={false} showArrow popoverContent={popoverContent()}>
              <Avatar
                text={`+${othersOnSameVersionAndPage.length - MAX_DISPLAY_USERS}`}
                borderShape="rounded"
                realtime={true}
              />
            </Popover>
          )}
          {self?.presence && (
            <Avatar
              key={self?.presence?.id}
              borderColor={self?.presence?.color}
              title={getAvatarTitle(self?.presence)}
              text={getAvatarText(self?.presence)}
              image={self?.presence?.image}
              borderShape="rounded"
              indexId={self?.presence?.id}
              realtime={true}
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
                indexId={id}
                realtime={true}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RealtimeAvatars;
