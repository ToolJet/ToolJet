import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { authenticationService, organizationService } from '@/_services';
import Modal from '../../HomePage/Modal';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const OrganizationSettings = () => {
  const isSingleOrganization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  const { admin } = authenticationService.currentUserValue;
  const [organization, setOrganization] = useState(authenticationService.currentUserValue?.organization);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const { t } = useTranslation();

  if (isSingleOrganization || !admin) return null;

  const showEditModal = () => {
    setNewOrgName(organization);
    setShowEditOrg(true);
  };

  const showCreateModal = () => {
    setNewOrgName('');
    setShowCreateOrg(true);
  };

  const createOrganization = () => {
    if (!(newOrgName && newOrgName.trim())) {
      toast.error('Workspace name can not be empty.', {
        position: 'top-center',
      });
      return;
    }

    setIsCreating(true);
    organizationService.createOrganization(newOrgName).then(
      (data) => {
        setIsCreating(false);
        authenticationService.updateCurrentUserDetails(data);
        window.location.href = '';
      },
      () => {
        setIsCreating(false);
        toast.error('Error while creating workspace', {
          position: 'top-center',
        });
      }
    );
  };

  const editOrganization = () => {
    if (!(newOrgName && newOrgName.trim())) {
      toast.error('Workspace name can not be empty.', {
        position: 'top-center',
      });
      return;
    }

    setIsCreating(true);
    organizationService.editOrganization({ name: newOrgName }).then(
      () => {
        authenticationService.updateCurrentUserDetails({ organization: newOrgName });
        toast.success('Workspace updated', {
          position: 'top-center',
        });
        setOrganization(newOrgName);
      },
      () => {
        toast.error('Error while editing workspace', {
          position: 'top-center',
        });
      }
    );
    setIsCreating(false);
    setShowEditOrg(false);
  };

  const getOrganizationMenu = () => {
    return (
      <div className="card" style={{ zIndex: 2 }}>
        <div className="dropdown-item org-avatar">
          <div className="row">
            <div className={`col-11`}>
              <div className="org-name" style={{ padding: `${admin ? '0px' : '0.6rem'} 0px` }}>
                {organization}
              </div>
            </div>
            <div className="col-1">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                onClick={() => showEditModal()}
              >
                <rect width="28" height="28" rx="6" fill="#F0F4FF" />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16.7467 8.69572C17.0858 8.35686 17.5456 8.1665 18.025 8.1665C18.5046 8.1665 18.9646 8.35703 19.3037 8.69617C19.6429 9.03531 19.8334 9.49528 19.8334 9.9749C19.8334 10.4544 19.643 10.9142 19.304 11.2533C19.3039 11.2534 19.3041 11.2532 19.304 11.2533L18.5667 11.9933C18.5462 12.0235 18.5226 12.0523 18.4958 12.079C18.4695 12.1053 18.4414 12.1286 18.4118 12.1488L14.4132 16.1616C14.3038 16.2715 14.1551 16.3332 14 16.3332H12.25C11.9278 16.3332 11.6667 16.0721 11.6667 15.7499V13.9999C11.6667 13.8448 11.7284 13.6961 11.8383 13.5867L15.8511 9.58813C15.8713 9.55852 15.8946 9.53036 15.9209 9.50409C15.9476 9.4773 15.9764 9.45366 16.0066 9.43317L16.7463 8.69617C16.7464 8.69602 16.7466 8.69587 16.7467 8.69572ZM16.3399 10.7481L12.8333 14.2421V15.1666H13.7578L17.2518 11.66L16.3399 10.7481ZM18.0753 10.8336L17.1663 9.9246L17.5712 9.52113C17.6916 9.40078 17.8548 9.33317 18.025 9.33317C18.1952 9.33317 18.3584 9.40078 18.4788 9.52113C18.5991 9.64148 18.6667 9.8047 18.6667 9.9749C18.6667 10.1451 18.5991 10.3083 18.4788 10.4287L18.0753 10.8336ZM9.26256 11.0125C9.59075 10.6843 10.0359 10.4999 10.5 10.4999H11.0833C11.4055 10.4999 11.6667 10.7611 11.6667 11.0832C11.6667 11.4054 11.4055 11.6666 11.0833 11.6666H10.5C10.3453 11.6666 10.1969 11.728 10.0875 11.8374C9.97812 11.9468 9.91667 12.0952 9.91667 12.2499V17.4999C9.91667 17.6546 9.97812 17.803 10.0875 17.9124C10.1969 18.0218 10.3453 18.0832 10.5 18.0832H15.75C15.9047 18.0832 16.0531 18.0218 16.1625 17.9124C16.2719 17.803 16.3333 17.6546 16.3333 17.4999V16.9166C16.3333 16.5944 16.5945 16.3332 16.9167 16.3332C17.2388 16.3332 17.5 16.5944 17.5 16.9166V17.4999C17.5 17.964 17.3156 18.4091 16.9874 18.7373C16.6592 19.0655 16.2141 19.2499 15.75 19.2499H10.5C10.0359 19.2499 9.59075 19.0655 9.26256 18.7373C8.93437 18.4091 8.75 17.964 8.75 17.4999V12.2499C8.75 11.7858 8.93437 11.3407 9.26256 11.0125Z"
                  fill="#3E63DD"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="dropdown-item org-actions">
          <div onClick={showCreateModal}>{t('header.organization.menus.addWorkspace', 'Add workspace')}</div>
        </div>
        <div className="dropdown-divider"></div>
        <Link data-testid="settingsBtn" to="/users" className="dropdown-item" data-cy="manage-users">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.99967 2.66659C6.8951 2.66659 5.99967 3.56202 5.99967 4.66659C5.99967 5.77115 6.8951 6.66659 7.99967 6.66659C9.10424 6.66659 9.99967 5.77115 9.99967 4.66659C9.99967 3.56202 9.10424 2.66659 7.99967 2.66659ZM4.66634 4.66659C4.66634 2.82564 6.15873 1.33325 7.99967 1.33325C9.84062 1.33325 11.333 2.82564 11.333 4.66659C11.333 6.50753 9.84062 7.99992 7.99967 7.99992C6.15873 7.99992 4.66634 6.50753 4.66634 4.66659Z"
              fill="#C1C8CD"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.66634 10.6666C6.13591 10.6666 5.6272 10.8773 5.25213 11.2524C4.87705 11.6274 4.66634 12.1362 4.66634 12.6666V13.9999C4.66634 14.3681 4.36786 14.6666 3.99967 14.6666C3.63148 14.6666 3.33301 14.3681 3.33301 13.9999V12.6666C3.33301 11.7825 3.6842 10.9347 4.30932 10.3096C4.93444 9.68444 5.78229 9.33325 6.66634 9.33325H9.33301C10.2171 9.33325 11.0649 9.68444 11.69 10.3096C12.3152 10.9347 12.6663 11.7825 12.6663 12.6666V13.9999C12.6663 14.3681 12.3679 14.6666 11.9997 14.6666C11.6315 14.6666 11.333 14.3681 11.333 13.9999V12.6666C11.333 12.1362 11.1223 11.6274 10.7472 11.2524C10.3721 10.8773 9.86344 10.6666 9.33301 10.6666H6.66634Z"
              fill="#C1C8CD"
            />
          </svg>
          &nbsp;{t('header.organization.menus.menusList.manageUsers', 'Manage Users')}
        </Link>
        <Link data-tesid="settingsBtn" to="/groups" className="dropdown-item" data-cy="manage-groups">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.99967 2.66659C4.89511 2.66659 3.99967 3.56202 3.99967 4.66659C3.99967 5.77115 4.89511 6.66659 5.99967 6.66659C7.10424 6.66659 7.99967 5.77115 7.99967 4.66659C7.99967 3.56202 7.10424 2.66659 5.99967 2.66659ZM2.66634 4.66659C2.66634 2.82564 4.15873 1.33325 5.99967 1.33325C7.84062 1.33325 9.33301 2.82564 9.33301 4.66659C9.33301 6.50753 7.84062 7.99992 5.99967 7.99992C4.15873 7.99992 2.66634 6.50753 2.66634 4.66659ZM10.0205 1.92123C10.1118 1.56454 10.475 1.34943 10.8317 1.44075C11.5487 1.62434 12.1842 2.04134 12.6381 2.62601C13.0919 3.21068 13.3382 3.92978 13.3382 4.66992C13.3382 5.41006 13.0919 6.12915 12.6381 6.71383C12.1842 7.2985 11.5487 7.7155 10.8317 7.89909C10.475 7.99041 10.1118 7.7753 10.0205 7.41861C9.92918 7.06193 10.1443 6.69874 10.501 6.60742C10.9312 6.49727 11.3125 6.24707 11.5848 5.89626C11.8571 5.54546 12.0049 5.114 12.0049 4.66992C12.0049 4.22583 11.8571 3.79438 11.5848 3.44357C11.3125 3.09277 10.9312 2.84257 10.501 2.73242C10.1443 2.64109 9.92918 2.27791 10.0205 1.92123ZM4.66634 10.6666C4.13591 10.6666 3.6272 10.8773 3.25213 11.2524C2.87705 11.6274 2.66634 12.1362 2.66634 12.6666V13.9999C2.66634 14.3681 2.36786 14.6666 1.99967 14.6666C1.63148 14.6666 1.33301 14.3681 1.33301 13.9999V12.6666C1.33301 11.7825 1.6842 10.9347 2.30932 10.3096C2.93444 9.68444 3.78229 9.33325 4.66634 9.33325H7.33301C8.21706 9.33325 9.06491 9.68444 9.69003 10.3096C10.3152 10.9347 10.6663 11.7825 10.6663 12.6666V13.9999C10.6663 14.3681 10.3679 14.6666 9.99967 14.6666C9.63148 14.6666 9.33301 14.3681 9.33301 13.9999V12.6666C9.33301 12.1362 9.12229 11.6274 8.74722 11.2524C8.37215 10.8773 7.86344 10.6666 7.33301 10.6666H4.66634ZM11.3542 9.93326C11.4462 9.57676 11.8098 9.36238 12.1663 9.45442C12.8787 9.63833 13.5102 10.0528 13.9624 10.6331C14.4146 11.2134 14.6621 11.9271 14.6663 12.6628L14.6664 12.6666L14.6663 13.9999C14.6663 14.3681 14.3679 14.6666 13.9997 14.6666C13.6315 14.6666 13.333 14.3681 13.333 13.9999V12.6686C13.3301 12.2278 13.1816 11.8003 12.9107 11.4526C12.6393 11.1044 12.2604 10.8558 11.833 10.7454C11.4765 10.6534 11.2621 10.2898 11.3542 9.93326Z"
              fill="#C1C8CD"
            />
          </svg>
          &nbsp;{t('header.organization.menus.menusList.manageGroups', 'Manage Groups')}
        </Link>
        <Link data-tesid="settingsBtn" to="/manage-sso" className="dropdown-item" data-cy="manage-sso">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.55814 1.50062C7.81037 1.27746 8.18941 1.27746 8.44164 1.50062C9.86909 2.76352 11.7321 3.42107 13.6361 3.33395C13.9429 3.31991 14.2195 3.51726 14.3062 3.8119C14.6338 4.9263 14.734 6.09518 14.6009 7.24908C14.4678 8.40299 14.1042 9.51837 13.5315 10.5289C12.9588 11.5395 12.1889 12.4247 11.2674 13.1318C10.3459 13.8389 9.29162 14.3536 8.16727 14.6452C8.0575 14.6737 7.94228 14.6737 7.83251 14.6452C6.70816 14.3536 5.65391 13.8389 4.7324 13.1318C3.81089 12.4247 3.04093 11.5395 2.46827 10.5289C1.89561 9.51837 1.53194 8.40299 1.39886 7.24908C1.26579 6.09518 1.36602 4.9263 1.69362 3.8119C1.78023 3.51726 2.05691 3.31991 2.3637 3.33395C4.26763 3.42107 6.13069 2.76352 7.55814 1.50062ZM2.84791 4.67368C2.67246 5.46758 2.63 6.28632 2.72342 7.09633C2.83602 8.07271 3.14374 9.01649 3.6283 9.8716C4.11286 10.7267 4.76437 11.4757 5.5441 12.074C6.27794 12.6371 7.11127 13.056 7.99989 13.3091C8.88851 13.056 9.72184 12.6371 10.4557 12.074C11.2354 11.4757 11.8869 10.7267 12.3715 9.8716C12.856 9.01649 13.1638 8.07271 13.2764 7.09633C13.3698 6.28631 13.3273 5.46758 13.1519 4.67368C11.2845 4.64164 9.477 4.00683 7.99989 2.86474C6.52278 4.00683 4.71527 4.64164 2.84791 4.67368ZM6.66656 7.33325C6.66656 6.59687 7.26351 5.99992 7.99989 5.99992C8.73627 5.99992 9.33322 6.59687 9.33322 7.33325C9.33322 7.82677 9.06509 8.25767 8.66656 8.48821V9.66659C8.66656 10.0348 8.36808 10.3333 7.99989 10.3333C7.6317 10.3333 7.33322 10.0348 7.33322 9.66659V8.48821C6.93469 8.25767 6.66656 7.82677 6.66656 7.33325Z"
              fill="#C1C8CD"
            />
          </svg>
          &nbsp;{t('header.organization.menus.menusList.manageSso', 'Manage SSO')}
        </Link>
        <Link data-tesid="settingsBtn" to="/manage-environment-vars" className="dropdown-item">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.3333 2.33325C11.7015 2.33325 12 2.63173 12 2.99992V4.11019L13.0066 3.54416C13.3275 3.36369 13.734 3.47756 13.9144 3.79848C14.0949 4.11941 13.981 4.52588 13.6601 4.70634L12.6932 5.25009L13.6602 5.79424C13.9811 5.97479 14.0949 6.38128 13.9143 6.70217C13.7338 7.02305 13.3273 7.13681 13.0064 6.95626L12 6.38998V7.49992C12 7.86811 11.7015 8.16659 11.3333 8.16659C10.9651 8.16659 10.6667 7.86811 10.6667 7.49992V6.38998L9.66025 6.95626C9.33937 7.13681 8.93287 7.02305 8.75232 6.70217C8.57177 6.38128 8.68554 5.97479 9.00642 5.79424L9.97351 5.25009L9.00657 4.70634C8.68564 4.52588 8.57177 4.11941 8.75224 3.79848C8.93271 3.47756 9.33917 3.36369 9.6601 3.54416L10.6667 4.11019V2.99992C10.6667 2.63173 10.9651 2.33325 11.3333 2.33325ZM4.33333 10.6666C4.06812 10.6666 3.81376 10.7719 3.62623 10.9595C3.43869 11.147 3.33333 11.4014 3.33333 11.6666C3.33333 11.9318 3.43869 12.1862 3.62623 12.3737C3.81376 12.5612 4.06812 12.6666 4.33333 12.6666C4.59855 12.6666 4.8529 12.5612 5.04044 12.3737C5.22798 12.1862 5.33333 11.9318 5.33333 11.6666C5.33333 11.4014 5.22798 11.147 5.04044 10.9595C4.8529 10.7719 4.59855 10.6666 4.33333 10.6666ZM2.68342 10.0167C3.121 9.57908 3.71449 9.33325 4.33333 9.33325C4.95217 9.33325 5.54566 9.57908 5.98325 10.0167C6.42083 10.4543 6.66667 11.0477 6.66667 11.6666C6.66667 12.2854 6.42083 12.8789 5.98325 13.3165C5.54566 13.7541 4.95217 13.9999 4.33333 13.9999C3.71449 13.9999 3.121 13.7541 2.68342 13.3165C2.24583 12.8789 2 12.2854 2 11.6666C2 11.0477 2.24583 10.4543 2.68342 10.0167Z"
              fill="#C1C8CD"
            />
          </svg>
          &nbsp;{t('header.organization.menus.menusList.manageEnv', 'Manage Environment Variables')}
        </Link>
      </div>
    );
  };

  return (
    <>
      <OverlayTrigger trigger="click" placement={'bottom'} rootClose={true} overlay={getOrganizationMenu()}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="#3E63DD "
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </OverlayTrigger>
      <Modal
        show={showCreateOrg}
        closeModal={() => setShowCreateOrg(false)}
        title={t('header.organization.createWorkspace', 'Create workspace')}
      >
        <div className="row">
          <div className="col modal-main">
            <input
              type="text"
              onChange={(e) => setNewOrgName(e.target.value)}
              className="form-control"
              placeholder={t('header.organization.workspaceName', 'workspace name')}
              disabled={isCreating}
              maxLength={25}
            />
          </div>
        </div>
        <div className="row">
          <div className="col d-flex modal-footer-btn">
            <button className="btn btn-light" onClick={() => setShowCreateOrg(false)}>
              {t('globals.cancel', 'Cancel')}
            </button>
            <button
              disabled={isCreating}
              className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`}
              onClick={createOrganization}
            >
              {t('header.organization.createWorkspace', 'Create workspace')}
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        show={showEditOrg}
        closeModal={() => setShowEditOrg(false)}
        title={t('header.organization.editWorkspace', 'Edit workspace')}
      >
        <div className="row">
          <div className="col modal-main">
            <input
              type="text"
              onChange={(e) => setNewOrgName(e.target.value)}
              className="form-control"
              placeholder={t('header.organization.workspaceName', 'workspace name')}
              disabled={isCreating}
              value={newOrgName}
              maxLength={25}
            />
          </div>
        </div>
        <div className="row">
          <div className="col d-flex modal-footer-btn">
            <button className="btn btn-light" onClick={() => setShowEditOrg(false)}>
              {t('globals.cancel', 'Cancel')}
            </button>
            <button className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`} onClick={editOrganization}>
              {t('globals.save', 'Save')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
