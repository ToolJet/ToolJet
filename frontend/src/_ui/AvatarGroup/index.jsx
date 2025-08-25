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
            className="tw-flex tw-items-center tw-px-1 tw-h-10 hover:tw-bg-interactive-hover tw-cursor-pointer tw-rounded-md"
          >
            {renderAvatar(avatar, index + maxDisplay)}
            <div className="tw-ml-2 tw-text-truncate">
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
        'tw-w-5 tw-h-5 tw-inline-flex',
        variant === 'multiplayer' &&
          'tw-border-2 tw-border-solid tw-border-background-surface-layer-01 tw-transition-all tw-duration-200 tw-ease-in-out !tw-rounded-full hover:tw-transform hover:tw--translate-y-0.5 hover:tw-shadow-elevation-200'
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
    'tw-border-2 tw-border-solid tw-bg-background-surface-layer-02 tw-border-background-surface-layer-01 tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-text-text-medium tw-cursor-pointer -tw-mt-1.5 tw-z-10'
  );

  return (
    <>
      <style jsx>{`
        .avatar-list-stacked > .avatar {
          margin-top: -0.375rem;
        }
      `}</style>
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
    </>
  );
};

export default AvatarGroup;
