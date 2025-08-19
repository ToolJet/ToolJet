import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import cx from 'classnames';
import Avatar from '@/_ui/Avatar';
import './styles.scss';

const AvatarGroup = ({
  avatars = [],
  maxDisplay = 2,
  className = '',
  onAvatarClick,
  popoverContent,
  darkMode = false,
  variant = 'default', // 'default' | 'multiplayer'
}) => {
  const visibleAvatars = avatars.slice(0, maxDisplay);
  const hiddenCount = avatars.length - maxDisplay;
  const hasOverflow = hiddenCount > 0;

  const defaultPopoverContent = () => {
    return (
      <div className="tw-space-y-1 tw-text-sm ">
        {avatars.slice(maxDisplay, avatars.length).map((avatar, index) => (
          <div
            key={`hidden-${avatar.id || `avatar-${index}`}`}
            className="tw-flex tw-items-center tw-p-1 hover:tw-bg-interactive-hover tw-cursor-pointer tw-rounded-md"
          >
            {renderAvatar(avatar, index + maxDisplay)}
            <div className="tw-ml-2 tw-text-truncate tw-mt-1">
              <div className="tw-text-sm tw-font-medium">{avatar.title}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAvatar = (avatar, index) => (
    <Avatar
      key={avatar.id || index}
      borderColor={avatar.borderColor}
      title={avatar.title}
      text={avatar.text}
      image={avatar.image}
      borderShape={''}
      indexId={avatar.id || index}
      realtime={avatar.realtime || false}
      className={`${avatar.className} tw-w-5 tw-h-5`}
      onClick={onAvatarClick ? () => onAvatarClick(avatar, index) : undefined}
    />
  );

  const containerClasses = cx(
    'avatar-list-stacked',
    {
      'avatar-group-multiplayer': variant === 'multiplayer',
    },
    className
  );

  return (
    <div className={containerClasses}>
      {visibleAvatars.map((avatar, index) => renderAvatar(avatar, index))}
      {hasOverflow && (
        <OverlayTrigger
          trigger="click"
          placement="top"
          rootClose
          overlay={
            <Popover id="avatar-group-popover" className={`shadow tw-custom-popover ${darkMode ? 'dark-theme' : ''}`}>
              <Popover.Body className={`tw-p-1 tw-bg-background-surface-layer-01 tw-min-w-[200px]`}>
                {popoverContent || defaultPopoverContent()}
              </Popover.Body>
            </Popover>
          }
        >
          <div className="tw-border-2 tw-border-solid tw-bg-background-surface-layer-02 tw-border-border-default tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-text-text-medium tw-cursor-pointer -tw-mt-1.5 tw-z-10">
            +{hiddenCount}
          </div>
        </OverlayTrigger>
      )}
    </div>
  );
};

export default AvatarGroup;
