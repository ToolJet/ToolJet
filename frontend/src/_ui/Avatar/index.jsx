import React from 'react';
import { userService } from '../../_services';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';

// eslint-disable-next-line no-unused-vars
const Avatar = ({ text, image, avatarId, title = '', borderColor = '', borderShape, indexId = 0, className }) => {
  const formattedTitle = String(title).toLowerCase().replace(/\s+/g, '-');
  const [avatar, setAvatar] = React.useState();

  React.useEffect(() => {
    async function fetchAvatar() {
      const blob = await userService.getAvatar(avatarId);
      setAvatar(URL.createObjectURL(blob));
    }
    if (avatarId) fetchAvatar();

    () => avatar && URL.revokeObjectURL(avatar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarId]);

  return (
    <span
      data-tooltip-id={`tooltip-for-avatar-${formattedTitle}-${indexId}`}
      data-tooltip-content={title}
      style={{
        ...(image || avatar ? { backgroundImage: `url(${avatar ?? image})` } : {}),
      }}
      className={cx(`animation-fade avatar tj-avatar ${className}`, {
        'avatar-rounded': borderShape === 'rounded',
      })}
      data-cy="avatar-image"
    >
      {!image && !avatarId && text}
      <Tooltip id={`tooltip-for-avatar-${formattedTitle}-${indexId}`} className="tooltip" />
    </span>
  );
};

export default Avatar;
