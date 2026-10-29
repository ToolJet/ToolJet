import React, { useEffect, useState } from 'react';
import cx from 'classnames';
// eslint-disable-next-line import/no-unresolved
import * as Popover from '@radix-ui/react-popover';
import { shallow } from 'zustand/shallow';
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { libraryRunEnvironment, viewedLibraryVersionId } from '@/AppBuilder/_stores/slices/queryLibrarySlice';
import VersionSwitcherButton from '@/AppBuilder/Header/VersionManager/VersionSwitcherButton';
import { EnvironmentSwitcher } from '@/modules/Appbuilder/components';
import CreateDraftButton from '@/AppBuilder/Header/VersionManager/CreateDraftButton';
import ActionDialog from '@/components/ui/Dialog';
import Select from '@/_ui/Select';
import LibraryVersionItem from './LibraryVersionItem';

const errorMessage = (err, fallback) => (typeof err?.error === 'string' && err.error ? err.error : fallback);

// The module version dropdown, scoped to one library query: environment tabs, the query's draft and saved versions,
// and Save version / Promote / Release / Create draft version / Delete.
const LibraryVersionDropdown = ({ queryId, darkMode = false }) => {
  const { view, viewedId, environments, shownEnvironment, multiEnvironment, workspaceId, sessionId, actions } =
    useStore(
      (state) => ({
        view: state.queryLibrary.versionsByQueryId[queryId],
        viewedId: viewedLibraryVersionId(state, queryId),
        environments: state.environments,
        shownEnvironment: libraryRunEnvironment(state, queryId),
        multiEnvironment: !!state.license.featureAccess?.multiEnvironment,
        workspaceId: state.queryLibrary.workspaceId,
        sessionId: state.queryLibrary.sessionId,
        actions: state.queryLibrary,
      }),
      shallow
    );
  const [isOpen, setIsOpen] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // { title, message, confirmLabel, run } for Promote / Release / Delete.
  const [pending, setPending] = useState(null);
  const [draftForm, setDraftForm] = useState(null); // { fromVersionId, description }

  useEffect(() => {
    let cancelled = false;
    setLoadFailed(false);
    actions.loadLibraryVersions(queryId).catch(() => !cancelled && setLoadFailed(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId, workspaceId, sessionId]);

  if (loadFailed) {
    return (
      <div className="tw-py-2 tw-font-body-small tw-text-text-placeholder" data-cy="library-version-dropdown">
        Couldn&apos;t load versions
      </div>
    );
  }
  if (!view) return null;

  const development = environments.find((env) => env.priority === 1) ?? null;
  // Production is the default environment, as on the server (release needs it); else the last one.
  const production =
    environments.find((env) => env.isDefault || env.is_default) ??
    environments.reduce((last, env) => (!last || env.priority > last.priority ? env : last), null);
  // The server's promote target: the first environment after the version's, Development for a version with none.
  const nextEnvironment = (version) =>
    environments
      .filter((env) => env.priority > (version.environment?.priority ?? 0))
      .sort((a, b) => a.priority - b.priority)[0];
  const versions = view.versions;
  const drafts = (view.drafts ?? []).map((draft) => ({ ...draft, isDraft: true, environment: development }));
  const rows = [...drafts, ...versions];
  const viewed = rows.find((row) => row.id === viewedId);
  // Without the multi-environment licence every version stays in Development: no filter.
  const visibleRows =
    multiEnvironment && shownEnvironment ? rows.filter((row) => row.environment?.id === shownEnvironment.id) : rows;
  const releasedVersionId = versions.find((version) => version.isReleased)?.id;

  const run = async (action, success) => {
    try {
      const result = await action();
      if (success) toast.success(success(result));
    } catch (err) {
      toast.error(errorMessage(err, 'Something went wrong'));
    }
  };

  const save = async () => {
    setIsSaving(true);
    await run(
      () => actions.saveLibraryDraft(queryId, viewed.id, { name: viewed.name, description: viewed.description }),
      (saved) => `Saved ${saved.name}`
    );
    setIsSaving(false);
  };

  const confirm = (title, message, confirmLabel, action, success) =>
    setPending({ title, message, confirmLabel, run: () => run(action, success) });

  const promote = (version) => {
    const next = nextEnvironment(version);
    if (!next) return;
    confirm(
      'Promote version',
      version.environment
        ? `Promote ${version.name} from ${version.environment.name} to ${next.name}?`
        : `Promote ${version.name} to ${next.name}?`,
      `Promote to ${next.name}`,
      () => actions.promoteLibraryVersion(queryId, version.id),
      () => `Promoted ${version.name} to ${next.name}`
    );
  };

  const release = (version) =>
    confirm(
      'Release version',
      `Release ${version.name}? Apps using this query can only be released on the released version.`,
      'Release',
      () => actions.releaseLibraryVersion(queryId, version.id),
      () => `Released ${version.name}`
    );

  const remove = (version) =>
    version.isDraft
      ? confirm('Delete draft', 'Delete the draft? Its changes are lost.', 'Delete draft', () =>
          actions.deleteLibraryDraft(queryId, version.id)
        )
      : confirm('Delete version', `Delete ${version.name}? Apps can't pin it after this.`, 'Delete version', () =>
          actions.deleteLibraryVersion(queryId, version.id)
        );

  const openDraftForm = (version) =>
    setDraftForm({
      fromVersionId: version?.id ?? (viewed && !viewed.isDraft ? viewed.id : versions[0]?.id),
      description: '',
    });

  const createDraft = async () => {
    const form = draftForm;
    setDraftForm(null);
    await run(() =>
      actions.createLibraryDraft(queryId, {
        name: `v${versions.length + drafts.length + 1}`,
        fromVersionId: form.fromVersionId,
        description: form.description.trim() || undefined,
      })
    );
  };

  const canPromote = (version) =>
    multiEnvironment && !version.isReleased && version.environment?.id !== production?.id && !!nextEnvironment(version);
  const canRelease = (version) =>
    !version.isReleased && (!multiEnvironment || (!!production && version.environment?.id === production.id));

  const changeEnvironment = (env) => actions.setLibraryRunEnvironment(queryId, env);

  return (
    <>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <div className="tw-inline-block" data-cy="library-version-dropdown">
            <VersionSwitcherButton
              version={{ id: viewed?.id, name: viewed?.name ?? '', status: viewed?.isDraft ? 'DRAFT' : 'PUBLISHED' }}
              environment={shownEnvironment}
              releasedVersionId={releasedVersionId}
              isOpen={isOpen}
              darkMode={darkMode}
            />
          </div>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className={cx(
              'version-manager-popover tw-z-[1050] tw-min-w-[350px] tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-p-0 tw-shadow-md',
              { 'dark-theme theme-dark': darkMode }
            )}
          >
            <EnvironmentSwitcher
              environments={environments}
              selectedEnvironment={shownEnvironment}
              onEnvironmentChange={changeEnvironment}
              allowEmptyEnvironments
              darkMode={darkMode}
            />
            <div className="versions-list tw-max-h-80 tw-overflow-y-auto tw-p-2">
              {visibleRows.length === 0 ? (
                <div className="tw-flex tw-justify-center tw-px-3 tw-py-6 tw-font-body-default tw-text-text-placeholder">
                  No versions available
                </div>
              ) : (
                visibleRows.map((version) => (
                  <LibraryVersionItem
                    key={version.id}
                    version={version}
                    isViewed={version.id === viewedId}
                    onView={() => actions.viewLibraryVersion(queryId, version.id)}
                    onSave={save}
                    isSaveDisabled={isSaving}
                    onPromote={canPromote(version) ? promote : undefined}
                    onRelease={canRelease(version) ? release : undefined}
                    onCreateDraft={openDraftForm}
                    onDelete={remove}
                    darkMode={darkMode}
                  />
                ))
              )}
            </div>
            <div className="tw-h-px tw-bg-border-weak" />
            <CreateDraftButton
              onClick={() => openDraftForm()}
              disabled={versions.length === 0}
              disabledTooltip="Save a version first"
              darkMode={darkMode}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <ActionDialog
        open={!!pending}
        handleOpenChange={(open) => !open && setPending(null)}
        title={pending?.title}
        cancelBtnProps={{ onClick: () => setPending(null) }}
        submitActions={[
          {
            label: pending?.confirmLabel,
            onClick: () => {
              pending.run();
              setPending(null);
            },
          },
        ]}
      >
        <p className="tw-m-0 tw-font-body-default tw-text-text-default">{pending?.message}</p>
      </ActionDialog>

      <ActionDialog
        open={!!draftForm}
        handleOpenChange={(open) => !open && setDraftForm(null)}
        title="Create draft version"
        cancelBtnProps={{ onClick: () => setDraftForm(null) }}
        submitActions={[{ label: 'Create draft version', onClick: createDraft, disabled: !draftForm?.fromVersionId }]}
      >
        <div className="tw-flex tw-flex-col tw-gap-4">
          <label className="tw-flex tw-flex-col tw-gap-1 tw-font-body-small tw-text-text-default">
            Create from
            <Select
              options={versions.map((version) => ({ label: version.name, value: version.id }))}
              value={draftForm?.fromVersionId}
              onChange={(fromVersionId) => setDraftForm((form) => ({ ...form, fromVersionId }))}
              useMenuPortal={false}
              width="100%"
            />
          </label>
          <label className="tw-flex tw-flex-col tw-gap-1 tw-font-body-small tw-text-text-default">
            Description (optional)
            <textarea
              className="form-control tw-font-body-small"
              rows={3}
              maxLength={500}
              value={draftForm?.description ?? ''}
              onChange={(e) => setDraftForm((form) => ({ ...form, description: e.target.value }))}
              data-cy="library-draft-description-input"
            />
          </label>
        </div>
      </ActionDialog>
    </>
  );
};

export default LibraryVersionDropdown;
