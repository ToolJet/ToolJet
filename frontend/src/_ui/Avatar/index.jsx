import React from 'react';
import { userService } from '@/_services';
import cx from 'classnames';

// eslint-disable-next-line no-unused-vars
const Avatar = ({ text, image, avatarId, title = '', borderColor = '', borderShape }) => {
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
      data-tip={title}
      style={{
        // border: borderColor ? `1.5px solid ${borderColor}` : 'none',
        ...(image || avatar ? { backgroundImage: `url(${avatar ?? image})` } : {}),
      }}
      // className={`avatar avatar-sm ${borderShape === 'rounded' ? 'avatar-rounded' : ''} animation-fade`}
      className={cx('avatar avatar-sm animation-fade', {
        'avatar-rounded': borderShape === 'rounded',
      })}
    >
      {!image && !avatarId && text}
    </span>
  );
};

export default Avatar;
