import React from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/Rocket/Input/Input';
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/Rocket/Field/Field';
import ActionDialog from '@/pages/shared/components/ActionDialog';

export default function OrganizationDialog({
  mode,
  show,
  onClose,
  onSubmit,
  isSubmitting,
  isDisabled,
  name,
  slug,
  slugProgress,
  showSlugCheckmark,
  showLinkSuccess,
  showNameSuccess,
  onNameChange,
  onSlugChange,
  slugInputRef,
  baseHostURL,
}) {
  const { t } = useTranslation();

  const isCreate = mode === 'create';
  const title = isCreate
    ? t('header.organization.createWorkspace', 'Create workspace')
    : t('header.organization.editWorkspace', 'Edit workspace');
  const submitLabel = isCreate
    ? t('header.organization.createWorkspace', 'Create workspace')
    : t('globals.save', 'Save');
  const dataCy = isCreate ? 'create-workspace-button' : 'save-button';

  return (
    <ActionDialog
      open={show}
      handleOpenChange={(open) => !open && onClose()}
      title={title}
      cancelBtnProps={{ label: t('globals.cancel', 'Cancel'), onClick: onClose, 'data-cy': 'cancel-button' }}
      submitActions={[
        {
          label: submitLabel,
          disabled: isDisabled,
          isLoading: isSubmitting,
          onClick: onSubmit,
          'data-cy': dataCy,
        },
      ]}
    >
      <div className="tw-grid tw-gap-5">
        {/* Workspace name */}
        <Field>
          <FieldLabel data-cy="workspace-name-label">Workspace name</FieldLabel>
          <Input
            type="text"
            data-cy="workspace-name-input-field"
            placeholder={t('header.organization.workspaceName', 'Workspace name')}
            autoFocus
            maxLength={50}
            onChange={onNameChange}
            disabled={isSubmitting}
            defaultValue={name?.value || ''}
            aria-invalid={!!name?.error}
          />
          {name?.error ? (
            <FieldError className="tw-mb-0" data-cy="workspace-error-label">
              {name.error}
            </FieldError>
          ) : showNameSuccess ? (
            <p className="tw-text-text-success tw-text-sm tw-mb-0" data-cy="slug-sucess-label">
              Workspace name accepted!
            </p>
          ) : (
            <FieldDescription className="tw-mb-0" data-cy="workspace-name-info-label">
              Name must be unique and max 50 characters
            </FieldDescription>
          )}
        </Field>

        {/* Workspace slug */}
        <Field>
          <FieldLabel data-cy="slug-input-label">Unique slug</FieldLabel>
          <div className="tw-relative">
            <Input
              type="text"
              data-cy="workspace-slug-input-field"
              placeholder={t('header.organization.workspaceSlug', 'Unique slug')}
              maxLength={50}
              ref={slugInputRef}
              onChange={onSlugChange}
              disabled={isSubmitting}
              defaultValue={slug?.value || ''}
              aria-invalid={!!slug?.error}
              className={showSlugCheckmark ? 'tw-pr-8' : ''}
            />
            {showSlugCheckmark && (
              <div className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-pointer-events-none">
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
          </div>
          {slug?.error ? (
            <FieldError className="tw-mb-0" data-cy="input-label-error">
              {slug.error}
            </FieldError>
          ) : showSlugCheckmark ? (
            <p className="tw-text-text-success tw-text-sm tw-mb-0" data-cy="slug-sucess-label">
              Slug accepted!
            </p>
          ) : (
            <FieldDescription className="tw-mb-0" data-cy="slug-info-label">
              URL-friendly &apos;slug&apos; consists of lowercase letters, numbers, and hyphens
            </FieldDescription>
          )}
        </Field>

        {/* Workspace link */}
        <Field>
          <FieldLabel data-cy="workspace-link-label">Workspace link</FieldLabel>
          <div
            className="tw-bg-switch-tag tw-rounded-md tw-p-2 tw-text-text-default tw-font-body-default tw-break-all"
            data-cy="slug-field"
          >
            {slugProgress ? (
              <div className="tw-flex tw-items-center tw-gap-2">
                <div className="spinner-border text-secondary workspace-spinner" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Updating link
              </div>
            ) : (
              `${baseHostURL}/${slug?.value || '<workspace-slug>'}`
            )}
          </div>
          {showLinkSuccess && (
            <p className="tw-text-text-success tw-text-sm tw-mb-0" data-cy="slug-error-label">
              Link updated successfully!
            </p>
          )}
        </Field>
      </div>
    </ActionDialog>
  );
}
