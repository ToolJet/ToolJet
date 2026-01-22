import React, { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Link } from 'react-router-dom';
import Avatar from '@/_ui/Avatar';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const VirtualizedUserList = memo(({ users, isRoleGroup, removeUserFromGroup, openChangeRoleModal, t }) => {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 20,
  });

  return (
    <div
      ref={parentRef}
      className="group-users-list-container"
      style={{
        overflow: 'auto',
        position: 'relative',
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = users[virtualItem.index];
          const user = item.user;
          const groupUserId = item.id;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="manage-group-users-row"
              data-cy={`${String(user.email).toLowerCase().replace(/\s+/g, '-')}-user-row`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                alignItems: 'center',
                willChange: 'transform',
              }}
            >
              <p className="tj-text-sm d-flex align-items-center">
                <Avatar
                  className="name-avatar"
                  avatarId={user?.avatarId}
                  text={`${user.firstName ? user.firstName[0] : ''}${user.lastName ? user.lastName[0] : ''}`}
                />
                <span data-cy="user-name">{`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}</span>
              </p>
              <p className="tj-text-sm d-flex align-items-center" style={{ paddingLeft: '12px' }}>
                <span data-cy="user-email"> {user.email}</span>
              </p>
              <p className="tj-text-sm d-flex align-items-center">
                <div className="d-flex align-items-center edit-role-btn">
                  {!isRoleGroup && (
                    <Link to="#" className="remove-decoration">
                      <ButtonSolid
                        variant="dangerSecondary"
                        className="apps-remove-btn remove-decoration tj-text-xsm font-weight-600"
                        onClick={() => {
                          removeUserFromGroup(groupUserId);
                        }}
                        leftIcon="remove"
                        fill="#F3B0A2"
                        iconWidth="18"
                        data-cy="remove-button"
                      >
                        {t('globals.remove', 'Remove')}
                      </ButtonSolid>
                    </Link>
                  )}
                </div>
                {isRoleGroup && (
                  <div className="edit-role-btn">
                    <ButtonSolid
                      variant="tertiary"
                      iconWidth="17"
                      fill="var(--slate9)"
                      className="apps-remove-btn remove-decoration tj-text-xsm font-weight-600"
                      leftIcon="editable"
                      onClick={() => {
                        openChangeRoleModal(user);
                      }}
                      data-cy="edit-role-button"
                    >
                      Edit role
                    </ButtonSolid>
                  </div>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualizedUserList.displayName = 'VirtualizedUserList';

export default VirtualizedUserList;
