import React from 'react';
import { userService } from '@/_services';

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
        border: borderColor ? `1.5px solid ${borderColor}` : 'none',
        ...(image || avatar ? { backgroundImage: `url(${avatar ?? image})` } : {}),
      }}
      className={`avatar avatar-sm ${borderShape === 'rounded' ? 'avatar-rounded' : ''} animation-fade`}
    >
      {!image && !avatarId && text}
    </span>
  );
};

export default Avatar;
