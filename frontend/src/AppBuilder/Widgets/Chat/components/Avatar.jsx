import React, { useState } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const Avatar = ({ initialSrc, alt, fallbackIcon }) => {
  const [src, setSrc] = useState(initialSrc);
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  return error || !initialSrc ? (
    fallbackIcon
  ) : (
    <img src={src} alt={alt} className="avatar" style={{ width: '24px', height: '24px' }} onError={handleError} />
  );
};

const GetAvatar = ({ chatType, userAvatar, respondentAvatar }) => {
  if (chatType === 'message') {
    return (
      <Avatar
        initialSrc={userAvatar}
        alt="User avatar"
        fallbackIcon={
          <SolidIcon name="defaultsenderchatavatar" width="24" viewBox="0 0 24 24" fill={'var(--primary-brand)'} />
        }
      />
    );
  } else {
    return (
      <Avatar
        initialSrc={respondentAvatar}
        alt="Respondent avatar"
        fallbackIcon={
          <SolidIcon name="defaultresponseavatar" width="24" viewBox="0 0 24 24" fill={'var(--icons-strong)'} />
        }
      />
    );
  }
};

export default GetAvatar;
