import React, { useEffect, useRef, useState } from 'react';
import { ToolTip } from '@/_components';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { appsService } from '@/_services';
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { Check, LoaderCircle, PencilLine, TriangleAlert, X } from 'lucide-react';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import {
  APP_NAME_MAX_LENGTH,
  EDIT_APP_NAME_ICON_PROPS,
  EDIT_ICON_REVEAL_CLASS,
  INLINE_RENAME_ACTIONS_CLASS,
  INLINE_RENAME_ACTIONS_EXIT_CLASS,
  INLINE_RENAME_ACTION_CLASS,
  INLINE_RENAME_INPUT_CLASS,
  INLINE_RENAME_INPUT_STYLE,
  INLINE_RENAME_SAVE_COLOR_CLASS,
  INLINE_RENAME_TRIGGER_CLASS,
  INLINE_RENAME_TRANSITION_MS,
  getInlineNameCursorPosition,
  normalizeAppName,
  validateInlineAppName,
} from './EditAppName.utils';

function EditAppName() {
  const { moduleId, appType } = useModuleContext();
  const [appId, appName, setAppName, selectedVersion, orgGit] = useStore(
    (state) => [
      state.appStore.modules[moduleId].app.appId,
      state.appStore.modules[moduleId].app.appName,
      state.setAppName,
      state.selectedVersion,
      state.orgGit,
    ],
    shallow
  );
  const workspaceActiveBranch = useWorkspaceBranchesStore((state) => state.currentBranch);
  const isMultiBranchingEnabled = useWorkspaceBranchesStore((state) => state.isMultiBranchingEnabled);
  const defaultBranchName = orgGit?.git_https?.github_branch || 'main';
  const isDraftVersion = selectedVersion?.status === 'DRAFT';
  const isGitSyncEnabled = orgGit?.git_https?.is_enabled || orgGit?.git_lab?.is_enabled;
  const isOnDefaultBranch = workspaceActiveBranch
    ? workspaceActiveBranch.is_default ||
      workspaceActiveBranch.isDefault ||
      workspaceActiveBranch.name === defaultBranchName
    : selectedVersion?.versionType !== 'branch';
  const isVersionUnsynced = selectedVersion?.isSynced === false;
  const isRenameDisabled = !isGitSyncEnabled
    ? false
    : !isDraftVersion || (isMultiBranchingEnabled && isOnDefaultBranch && !isVersionUnsynced);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(appName);
  const [errorText, setErrorText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef(null);
  const exitTimeoutRef = useRef(null);
  const appTypeName = appType === 'module' ? 'Module' : 'App';
  const isOnFeatureBranch =
    workspaceActiveBranch && !workspaceActiveBranch.is_default && !workspaceActiveBranch.isDefault;
  const normalizedDraftName = normalizeAppName(draftName);
  const hasChanged = normalizedDraftName !== appName;
  const { isAtLimit } = validateInlineAppName(draftName);
  const isSaveDisabled = isSaving || isClosing || !hasChanged || !!errorText || normalizedDraftName.length === 0;

  useEffect(() => {
    if (!isEditing) setDraftName(appName);
  }, [appName, isEditing]);

  useEffect(() => () => window.clearTimeout(exitTimeoutRef.current), []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const cursorPosition = getInlineNameCursorPosition(appName);
      inputRef.current.focus();
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [appName, isEditing]);

  const getDisabledTooltipMessage = () => {
    if (isGitSyncEnabled && isMultiBranchingEnabled && isOnDefaultBranch && !isVersionUnsynced) {
      return "Renaming isn't allowed on default branch. Switch branch to update name.";
    }
    if (!isDraftVersion && isGitSyncEnabled) return 'Renaming of app is only allowed on draft versions';
    return appName;
  };

  const startEditing = () => {
    if (isRenameDisabled) return;
    setDraftName(appName);
    setErrorText('');
    setIsClosing(false);
    setIsEditing(true);
  };

  const closeWithAnimation = () => {
    if (isClosing) return;
    setIsClosing(true);
    exitTimeoutRef.current = window.setTimeout(() => {
      setErrorText('');
      setIsClosing(false);
      setIsEditing(false);
    }, INLINE_RENAME_TRANSITION_MS);
  };

  const cancelEditing = () => {
    if (isSaving || isClosing) return;
    closeWithAnimation();
  };

  const handleInputChange = (event) => {
    const nextName = event.target.value;
    setDraftName(nextName);
    setErrorText(validateInlineAppName(nextName).errorMsg);
  };

  const handleSave = async () => {
    const nextName = normalizeAppName(draftName);
    const validation = validateInlineAppName(nextName);
    setDraftName(nextName);
    setErrorText(validation.errorMsg);
    if (validation.errorMsg || !nextName || nextName === appName) return;

    setIsSaving(true);
    try {
      await appsService.saveApp(appId, { name: nextName, editingVersionId: selectedVersion?.id });
      setAppName(nextName);
      toast.success(`${appTypeName} name has been updated!`);
      closeWithAnimation();
    } catch (errorResponse) {
      if (errorResponse.statusCode === 409) {
        setErrorText(`${appTypeName} name already exists`);
      } else if (errorResponse.statusCode === 451) {
        closeWithAnimation();
      } else {
        const errorMessage = errorResponse?.error || errorResponse?.message || 'Some Error Occured';
        toast.error(errorMessage, { position: 'top-center', style: { fontSize: '12px' } });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  };

  const nameButton = (
    <button
      className={INLINE_RENAME_TRIGGER_CLASS}
      style={{ cursor: isRenameDisabled ? 'not-allowed' : 'pointer', opacity: isRenameDisabled ? 0.6 : 1 }}
      type="button"
      data-cy="edit-app-name-button"
      onClick={startEditing}
      disabled={isRenameDisabled}
    >
      <OverflowTooltip
        placement="bottom"
        childrenClassName="tw-font-title-large tw-block tw-min-w-0 tw-max-w-[50ch] tw-text-start tw-text-[var(--slate12)]"
        data-cy="editor-app-name-input"
      >
        {appName}
      </OverflowTooltip>
      {!isRenameDisabled && (
        <span className={EDIT_ICON_REVEAL_CLASS}>
          <PencilLine {...EDIT_APP_NAME_ICON_PROPS} className="tw-text-[var(--editor-header-icon)]" />
        </span>
      )}
    </button>
  );

  return (
    <div className="tw-h-full tw-min-w-0 tw-max-w-full tw-flex tw-items-start tw-justify-start">
      {isEditing ? (
        <div className="app-name-inline-editor tw-relative tw-flex tw-h-8 tw-min-w-0 tw-max-w-full tw-items-center tw-gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={draftName}
            maxLength={APP_NAME_MAX_LENGTH}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isSaving || isClosing}
            aria-label={`${appTypeName} name`}
            aria-invalid={!!errorText}
            data-cy={`${appTypeName.toLowerCase()}-name-input`}
            className={INLINE_RENAME_INPUT_CLASS}
            style={INLINE_RENAME_INPUT_STYLE}
          />
          {isOnFeatureBranch && (
            <ToolTip
              message="This is a global setting which follows the same PR flow but is not version controlled. It applies across all versions once merged."
              placement="bottom"
              width="272px"
            >
              <span className="tw-inline-flex tw-shrink-0 tw-items-center">
                <TriangleAlert size={16} className="tw-text-[var(--icon-warning)]" />
              </span>
            </ToolTip>
          )}
          <span className={`${INLINE_RENAME_ACTIONS_CLASS} ${isClosing ? INLINE_RENAME_ACTIONS_EXIT_CLASS : ''}`}>
            <button
              type="button"
              className={`app-name-inline-action ${INLINE_RENAME_ACTION_CLASS} ${INLINE_RENAME_SAVE_COLOR_CLASS}`}
              onClick={handleSave}
              disabled={isSaveDisabled}
              data-cy="rename-app-button"
              aria-label="Save app name"
            >
              {isSaving ? <LoaderCircle size={13} className="tw-animate-spin" /> : <Check size={13} />}
            </button>
            <button
              type="button"
              className={`app-name-inline-action ${INLINE_RENAME_ACTION_CLASS} tw-text-[var(--icon-danger)]`}
              onClick={cancelEditing}
              disabled={isSaving || isClosing}
              aria-label="Cancel rename"
              data-cy="cancel-button"
            >
              <X size={14} />
            </button>
          </span>
          {(errorText || isAtLimit) && (
            <span
              className={`tw-absolute tw-left-0 tw-top-[34px] tw-z-20 tw-whitespace-nowrap tw-rounded tw-bg-[var(--surfaces-surface-01)] tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-shadow-sm ${
                errorText ? 'tw-text-[var(--text-danger)]' : 'tw-text-[var(--text-warning)]'
              }`}
              role={errorText ? 'alert' : 'status'}
              data-cy={`${appTypeName.toLowerCase()}-name-error-label`}
            >
              {errorText || 'Maximum length has been reached'}
            </span>
          )}
        </div>
      ) : isRenameDisabled ? (
        <ToolTip message={getDisabledTooltipMessage()} placement="bottom" maxWidth="210px" isVisible={isRenameDisabled}>
          {nameButton}
        </ToolTip>
      ) : (
        nameButton
      )}
    </div>
  );
}

export default EditAppName;
