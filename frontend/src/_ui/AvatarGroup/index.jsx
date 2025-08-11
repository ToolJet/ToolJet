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
    return avatars.slice(maxDisplay, avatars.length).map((avatar, index) => (
      <div key={`hidden-${avatar.id || `avatar-${index}`}`} className="list-group">
        <div className="list-group-item border-0">
          <div className="row align-items-center">
            <div className="col-auto">{renderAvatar(avatar, index + maxDisplay)}</div>
            <div className={`col text-truncate ${darkMode && 'text-white'}`}>
              {avatar.title}
              {avatar.subtitle && (
                <div className={`d-block ${darkMode ? 'text-light' : 'text-muted'} text-truncate mt-n1`}>
                  {avatar.subtitle}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ));
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
      className={`${avatar.className} tw-w-8 tw-h-8`}
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
            <Popover id="avatar-group-popover" className="shadow">
              <Popover.Body>{popoverContent || defaultPopoverContent()}</Popover.Body>
            </Popover>
          }
        >
          <div className="tw-border-2 tw-border-solid tw-bg-interactive-selected tw-border-background-surface-layer-01 tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-text-text-medium tw-cursor-pointer -tw-mt-1.5 tw-z-10">
            +{hiddenCount}
          </div>
        </OverlayTrigger>
      )}
    </div>
  );
};

export default AvatarGroup;
