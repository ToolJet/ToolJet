import React, { useState, useEffect } from 'react';
import { organizationService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { validateName, handleHttpErrorMessages } from '@/_helpers/utils';
import { appendWorkspaceId, getHostURL } from '@/_helpers/routes';
import _ from 'lodash';

export const EditOrganization = ({ showEditOrg, setShowEditOrg, currentValue }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState({ value: '', error: '' });
  const [slug, setSlug] = useState({ value: '', error: '' });
  const [slugProgress, setSlugProgress] = useState(false);
  const [workspaceNameProgress, setWorkspaceNameProgress] = useState(false);
  const [isNameDisabled, setNameDisabled] = useState(false);
  const [isSlugDisabled, setSlugDisabled] = useState(false);
  const { t } = useTranslation();
  const darkMode = localStorage.getItem('darkMode') === 'true';

  useEffect(
    () => {
      setName({
        value: currentValue?.name,
      });
      setSlug({
        value: currentValue?.slug,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentValue]
  );

  const editOrganization = () => {
    let emptyError = false;

    [name, slug].map((field, index) => {
      if (!field?.value?.trim()) {
        index === 0
          ? setName({
              ...name,
              error: `Workspace name can't be empty`,
            })
          : setSlug({ ...slug, error: `Workspace slug can't be empty` });
        emptyError = true;
      }
    });
    const errorFound = !_.isEmpty(name.error) || !_.isEmpty(slug.error);

    if (!emptyError && !errorFound) {
      setIsCreating(true);
      const data = {
        ...(name?.value && name?.value !== currentValue?.name && { name: name.value.trim() }),
        ...(slug?.value && slug?.value !== currentValue?.slug && { slug: slug.value.trim() }),
      };
      organizationService.editOrganization(data).then(
        () => {
          toast.success('Workspace updated');
          setIsCreating(false);
          setShowEditOrg(false);
          const newPath = appendWorkspaceId(slug.value, location.pathname, true);
          window.history.replaceState(null, null, newPath);
          window.location.reload();
        },
        (error) => {
          handleHttpErrorMessages(error, 'Workspace');
          setIsCreating(false);
        }
      );
    }
  };

  const handleInputChange = async (value, field) => {
    const trimmedValue = value?.trim();
    const prevValue = field === 'name' ? currentValue?.name : currentValue?.slug;
    //reset fields
    if (field === 'slug') {
      setSlug({
        ...slug,
        error: null,
      });
    }
    if (field === 'name') {
      setName({
        ...name,
        error: null,
      });
    }
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
    if (error?.status === true && value !== prevValue) {
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

    /* Checking for if the user entered the same value or not */
    let isValueTheSame = false;
    if (error?.status) {
      if (field === 'name') {
        isValueTheSame = trimmedValue === currentValue?.name && slug?.value === currentValue?.slug;
      } else {
        isValueTheSame = trimmedValue === currentValue?.slug && name?.value === currentValue?.name;
      }
    }

    const disabled = isValueTheSame || !error?.status;
    const updatedValue = {
      value,
      error: error?.errorMsg,
    };

    if (field === 'slug') {
      setSlug(updatedValue);
      setSlugDisabled(disabled);
      setSlugProgress(false);
    }
    if (field === 'name') {
      setName(updatedValue);
      setNameDisabled(disabled);
      setWorkspaceNameProgress(false);
    }
    return;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editOrganization();
    }
  };

  const closeModal = () => {
    setName({ value: currentValue?.name, error: '' });
    setSlug({ value: currentValue?.slug, error: '' });
    setShowEditOrg(false);
    setSlugDisabled(false);
    setNameDisabled(false);
  };

  const delayedSlugChange = _.debounce(async (value) => {
    setSlugProgress(true);
    await handleInputChange(value, 'slug');
  }, 500);

  const delayedNameChange = _.debounce(async (value) => {
    setWorkspaceNameProgress(true);
    await handleInputChange(value, 'name');
  }, 500);

  const userHasntChangeAnythingYet = name?.value === currentValue?.name && slug?.value === currentValue?.slug;
  const baseConditions =
    isCreating ||
    (name?.value !== currentValue?.name && isNameDisabled) ||
    (slug?.value !== currentValue?.slug && isSlugDisabled) ||
    slugProgress ||
    workspaceNameProgress;
  const isDisabled = userHasntChangeAnythingYet || baseConditions;

  return (
    <AlertDialog
      show={showEditOrg}
      closeModal={closeModal}
      title={t('header.organization.editWorkspace', 'Edit workspace')}
    >
      <div className="workspace-folder-modal">
        <div className="row">
          <div className="col modal-main tj-app-input">
            <label data-cy="workspace-name-label">Workspace name</label>
            <input
              type="text"
              onChange={async (e) => {
                e.persist();
                await delayedNameChange(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              className={`form-control ${name?.error ? 'is-invalid' : 'is-valid'}`}
              placeholder={t('header.organization.workspaceName', 'Workspace name')}
              disabled={isCreating}
              maxLength={50}
              defaultValue={name?.value}
              data-cy="workspace-name-input-field"
              autoFocus
            />
            {name?.error ? (
              <label className="label tj-input-error" data-cy="workspace-error-label">
                {name?.error || ''}
              </label>
            ) : (
              <label className="label label-info" data-cy="workspace-name-info-label">
                Name must be unique and max 50 characters
              </label>
            )}
          </div>
        </div>
        <div className="row">
          <div className="col tj-app-input input-with-icon">
            <label data-cy="slug-input-label">Unique workspace slug</label>
            <input
              type="text"
              className={`form-control ${slug?.error ? 'is-invalid' : 'is-valid'}`}
              placeholder={t('header.organization.workspaceSlug', 'Unique workspace slug')}
              disabled={isCreating}
              maxLength={50}
              onChange={async (e) => {
                e.persist();
                await delayedSlugChange(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              defaultValue={slug?.value}
              data-cy="workspace-slug-input-field"
              autoFocusfields
            />
            {!slugProgress && slug?.value !== currentValue?.slug && !slug.error && (
              <div className="icon-container">
                <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.256 0.244078C14.5814 0.569515 14.5814 1.09715 14.256 1.42259L5.92263 9.75592C5.59719 10.0814 5.06956 10.0814 4.74412 9.75592L0.577452 5.58926C0.252015 5.26382 0.252015 4.73618 0.577452 4.41074C0.902889 4.08531 1.43053 4.08531 1.75596 4.41074L5.33337 7.98816L13.0775 0.244078C13.4029 -0.0813592 13.9305 -0.0813592 14.256 0.244078Z"
                    fill="#46A758"
                  />
                </svg>
              </div>
            )}
            {slug?.error ? (
              <label className="label tj-input-error" data-cy="input-label-error">
                {slug?.error || ''}
              </label>
            ) : slug?.value !== currentValue?.slug && !slugProgress ? (
              <label className="label label-success" data-cy="sucess-label">{`Slug accepted!`}</label>
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
                `${getHostURL()}/${slug?.value || '<workspace-slug>'}`
              ) : (
                <div className="d-flex gap-2">
                  <div class="spinner-border text-secondary workspace-spinner" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  {`Updating link`}
                </div>
              )}
            </div>
            <label className="label label-success label-updated" data-cy="slug-success-label">
              {!slugProgress && slug.value && !slug.error && slug?.value !== currentValue?.slug
                ? `Link updated successfully!`
                : ''}
            </label>
          </div>
        </div>
        <div className="row">
          <div className="col d-flex justify-content-end gap-2">
            <ButtonSolid variant="secondary" onClick={closeModal} className="cancel-btn" data-cy="cancel-button">
              {t('globals.cancel', 'Cancel')}
            </ButtonSolid>
            <ButtonSolid isLoading={isCreating} disabled={isDisabled} onClick={editOrganization} data-cy="save-button">
              {t('globals.save', 'Save')}
            </ButtonSolid>
          </div>
        </div>
      </div>
    </AlertDialog>
  );
};
