import React, { useState } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const Avatar = ({ initialSrc, alt, fallbackIcon }) => {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
    console.log('Image failed to load:', initialSrc); // Debug log
  };

  return error || !initialSrc ? (
    fallbackIcon
  ) : (
    <img
      src={initialSrc}
      alt={alt}
      className="avatar"
      style={{
        objectFit: 'cover',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
      }}
      onError={handleError}
    />
  );
};

const GetAvatar = ({ chatType, userAvatar, respondentAvatar }) => {
  console.log('Avatar props:', { chatType, userAvatar, respondentAvatar }); // Debug log

  if (chatType === 'message') {
    return (
      <Avatar
        initialSrc={userAvatar}
        alt="User avatar"
        fallbackIcon={
          <SolidIcon name="defaultsenderchatavatar" width="24" viewBox="0 0 24 24" fill={'var(--icons-strong)'} />
        }
      />
    );
  } else {
    return (
      <Avatar
        initialSrc={respondentAvatar}
        alt="Respondent avatar"
        fallbackIcon={
          <SolidIcon name="defaultresponseavatar" width="24" viewBox="0 0 24 24" fill={'var(--primary-brand)'} />
        }
      />
    );
  }
};

export default GetAvatar;
