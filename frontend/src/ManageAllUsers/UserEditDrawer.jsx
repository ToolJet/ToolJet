import React, { useEffect } from 'react';
import cx from 'classnames';
import Drawer from '@/_ui/Drawer';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
import { authenticationService } from '@/_services';
import { LicenseBanner } from '@/LicenseBanner';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export default function UserEditDrawer({
  onCancel,
  onClose,
  isEditUserDrawerOpen,
  changeOptions,
  fields,
  errors,
  superadminsCount,
  disabled = false,
  updatingUser,
  isUpdatingUser,
  setUserValues,
  updateUser,
  t,
}) {
  const { current, total, canAddUnlimited } = superadminsCount ?? {};
  const { super_admin } = authenticationService.currentSessionValue;
  const formEnabled = canAddUnlimited || current < total || updatingUser?.user_type === 'instance';
  const { first_name, last_name, email, user_type } = updatingUser ?? {};
  const archivedUserToSuperAdminCheck = updatingUser?.user_type === 'workspace' && updatingUser.status === 'archived';
  const superAdminToggleDisableCheck =
    !formEnabled ||
    (disabled && !(current > 1 && updatingUser?.user_type === 'instance')) ||
    archivedUserToSuperAdminCheck;

  useEffect(() => {
    if (updatingUser) {
      setUserValues({
        fullName: `${first_name}${last_name && ` ${last_name}`}`,
        email: email,
        userType: user_type,
      });
    }
  }, [updatingUser]);

  const isEdited =
    fields['fullName'] !== `${first_name}${last_name && ` ${last_name}`}` || fields['userType'] !== user_type;

  return (
    <Drawer
      disableFocus={true}
      isOpen={isEditUserDrawerOpen}
      onClose={() => {
        onClose();
      }}
      position="right"
    >
      <div>
        <div className="animation-fade invite-user-drawer-wrap">
          <div className="drawer-card-wrap invite-user-drawer-wrap">
            <div className="card-header">
              <div className="card-header-inner-wrap">
                <h3 className="tj-text-lg tj-text font-weight-500" data-cy="modal-title">
                  Edit user details
                </h3>
                <div
                  onClick={() => {
                    onClose();
                  }}
                  style={{ cursor: 'pointer' }}
                  data-cy="modal-close-button"
                >
                  <SolidIcon name="remove" width="16" />
                </div>
              </div>
            </div>
            <div className="manage-users-drawer-content">
              <div className={`invite-user-by-email`}>
                <form noValidate>
                  <label className="form-label" data-cy="name-label">
                    Name
                  </label>
                  <div className="form-group mb-3 ">
                    <ToolTip
                      delay={{ show: '0', hide: '0' }}
                      placement="bottom"
                      message="Only Super admin can edit user’s name"
                      show={!super_admin}
                    >
                      <div className="tj-app-input">
                        <input
                          type="text"
                          className={cx('form-control', { disabled: disabled })}
                          placeholder={t('header.organization.menus.manageUsers.enterFullName', 'Enter full name')}
                          name="fullName"
                          onChange={(event) => changeOptions('fullName', event.target.value)}
                          value={fields['fullName']}
                          data-cy="input-field-full-name"
                          disabled={disabled}
                        />
                        <span className="text-danger" data-cy="error-message-fullname">
                          {errors['fullName']}
                        </span>
                      </div>
                    </ToolTip>
                  </div>
                  <div className="form-group mb-3 ">
                    <label className="form-label" data-cy="email-address-label">
                      {t('header.organization.menus.manageUsers.emailAddress', 'Email Address')}
                    </label>
                    <ToolTip
                      delay={{ show: '0', hide: '0' }}
                      placement="bottom"
                      message="Cannot edit user email address"
                    >
                      <div className="tj-app-input">
                        <input
                          type="text"
                          className={cx('form-control', { disabled: true })}
                          aria-describedby="emailHelp"
                          placeholder={t('header.organization.menus.manageUsers.enterEmail', 'Enter Email')}
                          name="email"
                          value={fields['email']}
                          data-cy="input-field-email"
                          disabled={true}
                        />
                        <span className="text-danger" data-cy="error-message-email">
                          {errors['email']}
                        </span>
                      </div>
                    </ToolTip>
                  </div>
                  <div className="form-group mb-3">
                    <label className="form-check form-switch">
                      <input
                        disabled={superAdminToggleDisableCheck}
                        className="form-check-input"
                        type="checkbox"
                        onChange={(event) => changeOptions('userType', event.target.checked)}
                        checked={fields?.userType === 'instance'}
                        data-cy="super-admin-form-check-input"
                      />
                      <span className="form-check-label tj-text-xsm" data-cy="super-admin-form-check-label">
                        Super admin
                      </span>
                    </label>
                    {disabled && !(current > 1 && updatingUser?.user_type === 'instance') ? (
                      <LicenseBanner
                        classes="mt-3"
                        customMessage="Edit user details with our paid plans. For more,"
                        size="xsmall"
                      ></LicenseBanner>
                    ) : (
                      <LicenseBanner classes="mt-3 mb-3" limits={superadminsCount} type="super admins" size="xsmall" />
                    )}
                  </div>
                </form>
              </div>
            </div>
            <div className="manage-users-drawer-footer">
              <ButtonSolid
                onClick={() => {
                  onClose();
                }}
                variant="tertiary"
                data-cy="cancel-button"
              >
                {t('globals.cancel', 'Cancel')}
              </ButtonSolid>

              <ButtonSolid
                type="submit"
                variant="primary"
                disabled={
                  isUpdatingUser || !isEdited || (disabled && !(current > 1 && updatingUser?.user_type === 'instance'))
                }
                isLoading={isUpdatingUser}
                onClick={updateUser}
                data-cy="update-button"
              >
                Update
              </ButtonSolid>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
