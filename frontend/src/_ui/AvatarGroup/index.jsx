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
      className={cx(
        avatar.className,
        'tw-w-5 tw-h-5',
        variant === 'multiplayer' &&
          'tw-border-2 tw-border-white tw-transition-all tw-duration-200 tw-ease-in-out tw-rounded-full tw--mt-1.5 hover:tw-transform hover:tw--translate-y-0.5 hover:tw-shadow-elevation-200',
        darkMode && variant === 'multiplayer' && 'tw-border-[#2d343b]'
      )}
      onClick={onAvatarClick ? () => onAvatarClick(avatar, index) : undefined}
    />
  );

  const containerClasses = cx(
    'avatar-list-stacked',
    variant === 'multiplayer' && 'tw-flex tw-items-center tw-flex-col',
    className
  );

  const overflowClasses = cx(
    'tw-border-2 tw-border-solid tw-bg-background-surface-layer-02 tw-border-border-default tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-text-text-medium tw-cursor-pointer -tw-mt-1.5 tw-z-10',
    variant === 'multiplayer' &&
      "tw-bg-[#c3c7df] tw-text-[#2d343b] tw-font-['IBM_Plex_Sans'] tw-text-sm tw-font-medium tw-leading-4 tw-border-2 tw-border-white hover:tw-bg-[#8890992e]",
    darkMode &&
      variant === 'multiplayer' &&
      'tw-bg-[#8890992e] tw-text-white tw-border-[#2d343b] hover:tw-bg-[#c3c7df] hover:tw-text-[#2d343b]'
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
          <div className={overflowClasses}>+{hiddenCount}</div>
        </OverlayTrigger>
      )}
    </div>
  );
};

export default AvatarGroup;
