import React, { useState } from 'react';
import { organizationService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { validateName, handleHttpErrorMessages } from '@/_helpers/utils';
import { appendWorkspaceId, getHostURL } from '@/_helpers/routes';
import _ from 'lodash';

export const CreateOrganization = ({ showCreateOrg, setShowCreateOrg }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [fields, setFields] = useState({ name: { value: '', error: '' }, slug: { value: null, error: '' } });
  const [slugProgress, setSlugProgress] = useState(false);
  const [workspaceNameProgress, setWorkspaceNameProgress] = useState(false);
  const [isDisabled, setDisabled] = useState(true);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { t } = useTranslation();

  const createOrganization = () => {
    let emptyError = false;
    const fieldsTemp = fields;
    Object.keys(fields).map((key) => {
      if (!fields?.[key]?.value?.trim()) {
        fieldsTemp[key] = {
          error: `Workspace ${key} can't be empty`,
        };
        emptyError = true;
      }
    });
    setFields({ ...fields, ...fieldsTemp });

    if (!emptyError && !Object.keys(fields).find((key) => !_.isEmpty(fields[key].error))) {
      setIsCreating(true);
      organizationService.createOrganization({ name: fields['name'].value, slug: fields['slug'].value }).then(
        () => {
          setIsCreating(false);
          const newPath = appendWorkspaceId(fields['slug'].value, location.pathname, true);
          window.history.replaceState(null, null, newPath);
          window.location.reload();
        },
        (error) => {
          setIsCreating(false);
          handleHttpErrorMessages(error, 'workspace');
        }
      );
    }
  };

  const handleInputChange = async (value, field) => {
    setFields({
      ...fields,
      [field]: {
        ...fields[field],
        error: null,
      },
    });
    let error = validateName(
      value,
      `Workspace ${field}`,
      true,
      false,
      !(field === 'slug'),
      !(field === 'slug'),
      field === 'slug'
    );

    /* If the basic validation is passing. then check the uniqueness */
    if (error?.status === true) {
      try {
        await organizationService.checkWorkspaceUniqueness(
          field === 'name' ? value : null,
          field === 'slug' ? value : null
        );
      } catch (errResponse) {
        error = {
          status: false,
          errorMsg: errResponse?.error,
        };
      }
    }

    setFields({
      ...fields,
      [field]: {
        value,
        error: error?.errorMsg,
      },
    });

    const otherInputErrors = Object.keys(fields).find(
      (key) => (key !== field && !_.isEmpty(fields[key].error)) || (key !== field && _.isEmpty(fields[key].value))
    );
    setDisabled(!error?.status || otherInputErrors);
    field === 'slug' && setSlugProgress(false);
    field === 'name' && setWorkspaceNameProgress(false);
    return;
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      createOrganization();
    }
  };

  const closeModal = () => {
    setFields({ name: { value: '', error: '' }, slug: { value: null, error: '' } });
    setShowCreateOrg(false);
    setDisabled(true);
  };

  const delayedFieldChange = _.debounce(async (value, field) => {
    field === 'name' && setWorkspaceNameProgress(true);
    field === 'slug' && setSlugProgress(true);
    await handleInputChange(value, field);
  }, 500);

  return (
    <AlertDialog
      show={showCreateOrg}
      closeModal={closeModal}
      title={t('header.organization.createWorkspace', 'Create workspace')}
    >
      <div className="workspace-folder-modal">
        <div className="row">
          <div className="tj-app-input">
            <label data-cy="workspace-name-label">Workspace name</label>
            <input
              type="text"
              onChange={async (e) => {
                e.persist();
                await delayedFieldChange(e.target.value, 'name');
              }}
              className={`form-control ${fields['name']?.error ? 'is-invalid' : 'is-valid'}`}
              placeholder={t('header.organization.workspaceName', 'Workspace name')}
              disabled={isCreating}
              onKeyDown={handleKeyDown}
              maxLength={50}
              data-cy="workspace-name-input-field"
              autoFocus
            />
            {fields['name']?.error ? (
              <label className="label tj-input-error" data-cy="workspace-error-label">
                {fields['name']?.error || ''}
              </label>
            ) : (
              <label className="label label-info" data-cy="workspace-name-info-label">
                Name must be unique and max 50 characters
              </label>
            )}
          </div>
        </div>
        <div className="row">
          <div className="tj-app-input input-with-icon">
            <label data-cy="slug-input-label">Unique workspace slug</label>
            <input
              type="text"
              className={`form-control ${fields['slug']?.error ? 'is-invalid' : 'is-valid'}`}
              placeholder={t('header.organization.workspaceSlug', 'Unique workspace slug')}
              disabled={isCreating}
              maxLength={50}
              onChange={async (e) => {
                e.persist();
                await delayedFieldChange(e.target.value, 'slug');
              }}
              data-cy="workspace-slug-input-field"
              autoFocusfields
            />
            {!slugProgress && fields['slug'].value !== null && !fields['slug'].error && (
              <div className="icon-container">
                <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M14.256 0.244078C14.5814 0.569515 14.5814 1.09715 14.256 1.42259L5.92263 9.75592C5.59719 10.0814 5.06956 10.0814 4.74412 9.75592L0.577452 5.58926C0.252015 5.26382 0.252015 4.73618 0.577452 4.41074C0.902889 4.08531 1.43053 4.08531 1.75596 4.41074L5.33337 7.98816L13.0775 0.244078C13.4029 -0.0813592 13.9305 -0.0813592 14.256 0.244078Z"
                    fill="#46A758"
                  />
                </svg>
              </div>
            )}
            {fields['slug']?.error ? (
              <label className="label tj-input-error" data-cy="input-label-error">
                {fields['slug']?.error || ''}
              </label>
            ) : fields['slug'].value && !slugProgress ? (
              <label className="label label-success" data-cy="slug-sucess-label">{`Slug accepted!`}</label>
            ) : (
              <label
                className="label label-info"
                data-cy="slug-info-label"
              >{`URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens`}</label>
            )}
          </div>
        </div>
        <div className="row mb-3">
          <div className="col modal-main tj-app-input">
            <label data-cy="workspace-link-label">Workspace link</label>
            <div className={`tj-text-input break-all ${darkMode ? 'dark' : ''}`} data-cy="slug-field">
              {!slugProgress ? (
                `${getHostURL()}/${fields['slug']?.value || '<workspace-slug>'}`
              ) : (
                <div className="d-flex gap-2">
                  <div class="spinner-border text-secondary workspace-spinner" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  {`Updating link`}
                </div>
              )}
            </div>
            <label className="label label-success label-updated" data-cy="slug-error-label">
              {fields['slug'].value && !fields['slug'].error && !slugProgress ? `Link updated successfully!` : ''}
            </label>
          </div>
        </div>
        <div className="row">
          <div className="col d-flex justify-content-end gap-2">
            <ButtonSolid variant="secondary" onClick={closeModal} data-cy="cancel-button" className="cancel-btn">
              {t('globals.cancel', 'Cancel')}
            </ButtonSolid>
            <ButtonSolid
              disabled={isCreating || isDisabled || slugProgress || workspaceNameProgress}
              onClick={createOrganization}
              data-cy="create-workspace-button"
              isLoading={isCreating}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6 0.666992C6.36819 0.666992 6.66667 0.965469 6.66667 1.33366V5.33366H10.6667C11.0349 5.33366 11.3333 5.63214 11.3333 6.00033C11.3333 6.36852 11.0349 6.66699 10.6667 6.66699H6.66667V10.667C6.66667 11.0352 6.36819 11.3337 6 11.3337C5.63181 11.3337 5.33333 11.0352 5.33333 10.667V6.66699H1.33333C0.965145 6.66699 0.666668 6.36852 0.666668 6.00033C0.666668 5.63214 0.965145 5.33366 1.33333 5.33366H5.33333V1.33366C5.33333 0.965469 5.63181 0.666992 6 0.666992Z"
                  fill="#FDFDFE"
                />
              </svg>

              {t('header.organization.createWorkspace', 'Create workspace')}
            </ButtonSolid>
          </div>
        </div>
      </div>
    </AlertDialog>
  );
};
