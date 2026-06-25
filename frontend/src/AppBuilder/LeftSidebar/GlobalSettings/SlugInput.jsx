// components/SlugInput.js
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import InputComponent from '@/components/ui/Input/Index';
import { appsService } from '@/_services';
import { getWorkspaceId, validateName } from '@/_helpers/utils';
import { getHostURL, replaceEditorURL } from '@/_helpers/routes';
import useStore from '@/AppBuilder/_stores/store';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { ToolTip } from '@/_components/ToolTip';
import { TriangleAlert } from 'lucide-react';
import { TOOLTIP_MESSAGES } from '@/_helpers/constants';
// import { useStore } from '@/store';

const SlugInput = () => {
  const { moduleId } = useModuleContext();
  const {
    slug: oldSlug,
    appId,
    currentPage,
    app,
    setApp,
  } = useStore(
    (state) => ({
      globalSettings: state.globalSettings,
      slug: state.appStore.modules[moduleId].app.slug,
      appId: state.appStore.modules[moduleId].app.appId,
      app: state.appStore.modules[moduleId].app,
      setApp: state.setApp,
      currentPage: state.modules[moduleId].pages[state.modules[moduleId].currentPageIndex],
    }),
    shallow
  );
  const [slug, setSlug] = useState({ value: null, error: '' });
  const [slugProgress, setSlugProgress] = useState(false);
  const [isSlugUpdated, setSlugUpdatedState] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    /* 
    Only will fail for existed apps before the app/workspace url revamp which has 
    special chars or spaces in their app slugs 
  */
    const existedSlugErrors = validateName(oldSlug, 'App slug', true, false, false, false);

    setSlug({ value: oldSlug, error: existedSlugErrors.errorMsg });
  }, [oldSlug]);

  const handleInputChange = (value, field) => {
    setSlug({
      value: slug?.value,
      error: null,
    });

    const error = validateName(value, `App ${field}`, true, false, !(field === 'slug'), !(field === 'slug'));

    if (!_.isEmpty(value) && value !== oldSlug && _.isEmpty(error.errorMsg)) {
      setSlugProgress(true);
      appsService
        .setSlug(appId, value)
        .then(() => {
          setSlug({
            value,
            error: '',
          });
          setSlugProgress(false);
          setSlugUpdatedState(true);
          replaceEditorURL(value, currentPage?.handle);
          setApp({ ...app, slug: value });
        })
        .catch(({ error }) => {
          setSlug({
            value,
            error,
          });
          setSlugProgress(false);
          setSlugUpdatedState(false);
        });
    } else {
      setSlugProgress(false);
      setSlugUpdatedState(false);
      setSlug({
        value,
        error: error?.errorMsg,
      });
    }
  };

  const delayedSlugChange = _.debounce((value, field) => handleInputChange(value, field), 500);

  const { currentBranch, orgGitConfig } = useWorkspaceBranchesStore();
  const isBranchingEnabled = !!(orgGitConfig?.is_branching_enabled || orgGitConfig?.isBranchingEnabled);
  const isDefaultBranch = isBranchingEnabled && !!(currentBranch?.is_default || currentBranch?.isDefault);

  const SlugLabel = () => {
    const isOnFeatureBranch =
      isBranchingEnabled && !!currentBranch && !currentBranch.is_default && !currentBranch.isDefault;

    return (
      <div className="tw-flex tw-items-center tw-gap-1 tw-mb-1">
        <label className="tw-text-xs tw-font-medium tw-text-default tw-m-0" data-cy="unique-app-slug-label">
          Unique app slug
        </label>
        {isOnFeatureBranch && (
          <ToolTip
            message="This is a global setting which follows the same PR flow but are not version controlled, they apply across all versions once merged."
            placement="top"
            width="272px"
          >
            <span className="tw-flex tw-items-center">
              <TriangleAlert size={14} className="tw-text-[var(--icon-warning)]" />
            </span>
          </ToolTip>
        )}
      </div>
    );
  };

  return (
    <div className="app-slug-container">
      <div className="row">
        <div className="col">
          <SlugLabel />
          <ToolTip
            message={TOOLTIP_MESSAGES.DEFAULT_BRANCH_LOCKED}
            placement="top"
            width="210px"
            show={isDefaultBranch}
          >
            <div>
              <InputComponent
                helperText={
                  !slug?.error && !isSlugUpdated
                    ? "URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens"
                    : undefined
                }
                placeholder={t('editor.appSlug', 'Unique app slug')}
                maxLength={50}
                onChange={(e, validateObj) => {
                  e.persist();
                  delayedSlugChange(e.target.value, 'slug');
                }}
                data-cy="app-slug-input-field"
                defaultValue={slug?.value || oldSlug || ''}
                disabled={isDefaultBranch}
              />
            </div>
          </ToolTip>
          {slug?.error ? (
            <label className="label tj-input-error" data-cy="app-slug-error-label">
              {slug?.error || ''}
            </label>
          ) : isSlugUpdated ? (
            <label className="label label-success" data-cy="app-slug-accepted-label">{`Slug accepted!`}</label>
          ) : (
            <div></div>
          )}
        </div>
      </div>
      <div className="col modal-main tj-app-input">
        <label className="field-name" data-cy="app-link-label">
          App link
        </label>
        <div className={`tj-text-input break-all`} data-cy="app-link-field">
          {!slugProgress ? (
            `${getHostURL()}/${getWorkspaceId()}/apps/${slug?.value || oldSlug || ''}`
          ) : (
            <div className="d-flex gap-2">
              <div class="spinner-border text-secondary workspace-spinner" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              {`Updating link`}
            </div>
          )}
        </div>
        <label
          className="label label-success label-updated"
          data-cy="app-link-success-label"
          style={{ padding: '0px' }}
        >
          {isSlugUpdated ? `Link updated successfully!` : ''}
        </label>
      </div>
    </div>
  );
};

export default SlugInput;
