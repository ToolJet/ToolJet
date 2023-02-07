import React from 'react';
import { userService } from '../../_services';
import cx from 'classnames';

// eslint-disable-next-line no-unused-vars
const Avatar = ({ text, image, avatarId, title = '', borderColor = '', borderShape, className }) => {
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
    <div
      data-tip={title}
      style={{
        ...(image || avatar ? { backgroundImage: `url(${avatar ?? image})` } : {}),
      }}
      className={cx(`animation-fade tj-avatar ${className}`, {
        'avatar-rounded': borderShape === 'rounded',
      })}
    >
      {!image && !avatarId && text}
    </div>
  );
};

export default Avatar;
