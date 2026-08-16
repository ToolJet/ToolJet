import React from 'react';
import { userService } from '../../_services';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';

// eslint-disable-next-line no-unused-vars
const Avatar = ({ text, image, avatarId, title = '', borderShape, indexId = 0, className, realtime = false }) => {
  const formattedTitle = String(title).toLowerCase().replace(/\s+/g, '-');
  const [avatar, setAvatar] = React.useState();

  React.useEffect(() => {
    // #17526: the cleanup was constructed but never returned, so blob URLs
    // were never revoked. The stale-response guard prevents a late fetch for
    // a previous avatarId from overwriting the current one when the
    // virtualized list recycles this component.
    let stale = false;
    async function fetchAvatar() {
      try {
        const blob = await userService.getAvatar(avatarId);
        if (!stale) setAvatar(URL.createObjectURL(blob));
      } catch {
        // Avatar fetch failures leave the fallback text visible; not an error state.
      }
    }
    if (avatarId) fetchAvatar();

    return () => {
      stale = true;
      if (avatar) URL.revokeObjectURL(avatar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarId]);

  return (
    <span
      data-tooltip-id={`tooltip-for-avatar-${formattedTitle}-${indexId}`}
      data-tooltip-content={title}
      style={{
        ...(image || avatar ? { backgroundImage: `url(${avatar ?? image})` } : {}),
      }}
      className={cx(
        `!tw-shadow-none animation-fade avatar tj-text-xsm ${className} ${
          realtime ? 'tj-header-avatar' : 'tj-avatar '
        }`,
        {
          'avatar-rounded': borderShape === 'rounded',
        }
      )}
      data-cy="avatar-image"
    >
      {!image && !avatarId && text}
      <Tooltip id={`tooltip-for-avatar-${formattedTitle}-${indexId}`} className="tooltip" />
    </span>
  );
};

export default Avatar;
