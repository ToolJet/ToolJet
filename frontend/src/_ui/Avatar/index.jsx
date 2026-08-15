import React from 'react';
import { userService } from '../../_services';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';

// eslint-disable-next-line no-unused-vars
const Avatar = ({ text, image, avatarId, title = '', borderShape, indexId = 0, className, realtime = false }) => {
  const formattedTitle = String(title).toLowerCase().replace(/\s+/g, '-');
  const [avatar, setAvatar] = React.useState();

  React.useEffect(() => {
    let objectUrl;
    let ignore = false;

    async function fetchAvatar() {
      const blob = await userService.getAvatar(avatarId);
      // avatarId can change while this request is in flight, which happens as
      // rows are recycled in the virtualized user list. Without this the slower
      // response wins and the row shows someone else's picture.
      if (ignore) return;
      objectUrl = URL.createObjectURL(blob);
      setAvatar(objectUrl);
    }
    if (avatarId) fetchAvatar();

    return () => {
      ignore = true;
      // Drop the reference before revoking it. The next render happens with
      // the new avatarId but the old url still in state, so revoking without
      // clearing would paint a url that has just been invalidated.
      setAvatar(undefined);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
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
