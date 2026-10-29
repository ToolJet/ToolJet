import '@/test/setupMsw';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { VersionLifecycleProvider } from '../VersionLifecycleContext';
import { VersionManagerDropdownContent } from '../VersionManagerDropdown';
import EditionSaveModal from '../CreateVersionModal';
import EditionDraftModal from '../CreateDraftVersionModal';
import {
  PromoteVersionButton,
  ReleaseVersionButton,
} from '@/modules/common/components/BasePromoteReleaseButton/components';
import EditVersionModal from '../EditVersionModal';
import ReleaseConfirmation from '../../ReleaseConfirmation';

const draft = {
  id: 'library-draft',
  name: 'Library.candidate',
  status: 'DRAFT',
  description: 'Library description',
  currentEnvironmentId: 'development',
};
const saved = { id: 'library-saved', name: 'Library.v1', status: 'PUBLISHED', currentEnvironmentId: 'production' };
const environments = [
  { id: 'development', name: 'development', priority: 1 },
  { id: 'production', name: 'production', priority: 3 },
];
const cy = (value) => document.querySelector(`[data-cy="${value}"]`);
function value(overrides = {}) {
  return {
    resourceType: 'library-query',
    selectedVersionId: draft.id,
    versions: [draft, saved],
    environments,
    selectedEnvironment: environments[0],
    releasedVersionId: null,
    loading: false,
    error: null,
    capabilities: { readOnly: false, multiEnvironment: true, canPromote: true, canRelease: true },
    notices: [],
    actions: {
      selectVersion: jest.fn().mockResolvedValue(),
      selectEnvironment: jest.fn().mockResolvedValue(),
      refresh: jest.fn().mockResolvedValue(),
      saveDraft: jest.fn().mockResolvedValue(),
      createDraft: jest.fn().mockResolvedValue(),
      editDraft: jest.fn().mockResolvedValue(),
      promote: jest.fn().mockResolvedValue(),
      release: jest.fn().mockResolvedValue(),
      deleteVersion: jest.fn().mockResolvedValue(),
    },
    ...overrides,
  };
}
let requests;
beforeEach(() => {
  requests = [];
  server.use(
    http.all('*', ({ request }) => {
      requests.push(request.url);
      return HttpResponse.json({});
    })
  );
});
afterEach(() => expect(requests).toEqual([]));
const mount = (lifecycle, children) =>
  render(<VersionLifecycleProvider value={lifecycle}>{children}</VersionLifecycleProvider>);

describe('explicit lifecycle provider isolation', () => {
  it('renders supplied rows and opens the same save form without app or Git requests', async () => {
    const lifecycle = value();
    mount(lifecycle, <VersionManagerDropdownContent />);
    await userEvent.click(cy('version-switcher-button'));
    await userEvent.click(await screen.findByText('Save version'));
    expect(cy('version-name-input-field')).toHaveValue(draft.name);
    expect(cy('version-description-input-field')).toHaveValue(draft.description);
    fireEvent.submit(cy('version-name-input-field').closest('form'));
    await waitFor(() =>
      expect(lifecycle.actions.saveDraft).toHaveBeenCalledWith(draft.id, {
        name: draft.name,
        description: draft.description,
      })
    );
  });
  it('direct forms respect the supplied provider instead of mounting app wrappers', async () => {
    const lifecycle = value();
    mount(lifecycle, <EditVersionModal showEditAppVersion setShowEditAppVersion={() => {}} versionToEdit={draft} />);
    fireEvent.change(cy('edit-version-name-input-field'), { target: { value: 'Library.renamed' } });
    fireEvent.submit(cy('edit-version-name-input-field').closest('form'));
    await waitFor(() =>
      expect(lifecycle.actions.editDraft).toHaveBeenCalledWith(draft.id, {
        name: 'Library.renamed',
        description: draft.description,
      })
    );
  });
  it('uses the supplied release name and notices even when app identifiers are passed', () => {
    mount(
      value({ selectedVersionId: saved.id, notices: ['Library release notice'] }),
      <ReleaseConfirmation show appId="unrelated-app" versionId={saved.id} onClose={() => {}} onConfirm={() => {}} />
    );
    expect(screen.getByText('Release Library.v1')).toBeInTheDocument();
    expect(screen.getByText('Library release notice')).toBeInTheDocument();
  });
  it('selects a supplied version and environment without needing an app router', async () => {
    const lifecycle = value();
    mount(lifecycle, <VersionManagerDropdownContent />);
    await userEvent.click(cy('version-switcher-button'));
    await userEvent.click(await screen.findByText('Production'));
    expect(lifecycle.actions.selectEnvironment).toHaveBeenCalledWith('production');
    await userEvent.click(screen.getByText(saved.name));
    expect(lifecycle.actions.selectVersion).toHaveBeenCalledWith(saved.id);
  });
  it('creates a named draft through the edition form using only saved source options', async () => {
    const lifecycle = value();
    mount(lifecycle, <EditionDraftModal showCreateAppVersion setShowCreateAppVersion={() => {}} />);
    expect(screen.getByText(saved.name)).toBeInTheDocument();
    expect(screen.queryByText(draft.name)).not.toBeInTheDocument();
    fireEvent.change(cy('version-name-input-field'), { target: { value: 'another/draft' } });
    fireEvent.submit(cy('version-name-input-field').closest('form'));
    await waitFor(() =>
      expect(lifecycle.actions.createDraft).toHaveBeenCalledWith({ name: 'another/draft', fromVersionId: saved.id })
    );
  });
  it('the edition save form preserves loading and error recovery with a supplied action', async () => {
    let rejectSave;
    const lifecycle = value();
    lifecycle.actions.saveDraft.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectSave = reject;
        })
    );
    mount(lifecycle, <EditionSaveModal showCreateAppVersion setShowCreateAppVersion={() => {}} versionId={draft.id} />);
    fireEvent.submit(cy('version-name-input-field').closest('form'));
    expect(cy('version-name-input-field')).toBeDisabled();
    rejectSave(new Error('Resource save failed'));
    await waitFor(() => expect(cy('version-name-input-field')).not.toBeDisabled());
    expect(cy('version-name-input-field')).toHaveValue(draft.name);
  });
  it('promotes the explicitly selected row, using supplied names and ordered environments', async () => {
    const version = { ...saved, currentEnvironmentId: 'development' };
    const lifecycle = value({ versions: [draft, version] });
    mount(lifecycle, <PromoteVersionButton version={version} variant="inline" />);
    await userEvent.click(screen.getByRole('button', { name: 'Promote' }));
    expect(screen.getByText('Promote Library.v1')).toBeInTheDocument();
    expect(cy('current-env-name')).toHaveTextContent('Development');
    expect(cy('target-env-name')).toHaveTextContent('Production');
    await userEvent.click(cy('promote-button'));
    await waitFor(() => expect(lifecycle.actions.promote).toHaveBeenCalledWith(saved.id));
  });
  it('releases the explicit row instead of the unrelated selected draft', async () => {
    const lifecycle = value();
    mount(lifecycle, <ReleaseVersionButton version={saved} variant="inline" />);
    await userEvent.click(screen.getByRole('button', { name: 'Release' }));
    expect(screen.getByText('Release Library.v1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(lifecycle.actions.release).toHaveBeenCalledWith(saved.id));
  });
  it('keeps promote and release disabled when the adapter denies permission', () => {
    const lifecycle = value({ capabilities: { canPromote: false, canRelease: false } });
    mount(
      lifecycle,
      <>
        <PromoteVersionButton version={{ ...saved, currentEnvironmentId: 'development' }} variant="inline" />
        <ReleaseVersionButton version={saved} variant="inline" />
      </>
    );
    expect(screen.getByRole('button', { name: 'Promote' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Release' })).toBeDisabled();
  });
  it('keeps the search input available when its filter has fewer than six matches', async () => {
    const lifecycle = value({
      versions: [draft, saved, ...[2, 3, 4, 5].map((i) => ({ ...saved, id: `saved-${i}`, name: `saved-${i}` }))],
    });
    mount(lifecycle, <VersionManagerDropdownContent />);
    await userEvent.click(cy('version-switcher-button'));
    const search = screen.getByPlaceholderText(/Search/);
    await userEvent.type(search, 'candidate');
    expect(search).toBeInTheDocument();
    expect(screen.queryByText(saved.name)).not.toBeInTheDocument();
  });
});

it('keeps the Modules dependency message and acknowledgement through the shared dialog', async () => {
  const lifecycle = value({ resourceType: 'module' });
  lifecycle.actions.deleteVersion.mockRejectedValue({ code: 'VERSION_IN_USE' });
  mount(lifecycle, <VersionManagerDropdownContent />);
  await userEvent.click(cy('version-switcher-button'));
  await waitFor(() => expect(cy(`${draft.name.toLowerCase()}-version-more-menu-button`)).toBeInTheDocument());
  fireEvent.click(cy(`${draft.name.toLowerCase()}-version-more-menu-button`));
  await userEvent.click(await screen.findByText('Delete version'));
  await userEvent.click(screen.getByRole('button', { name: 'Delete version' }));
  expect(await screen.findByRole('dialog', { name: 'Dependent apps found!' })).toHaveTextContent(
    `Cannot delete ${draft.name} version of module as it is being used in one or more apps.`
  );
  await userEvent.click(screen.getByRole('button', { name: 'I understand' }));
  expect(screen.queryByRole('dialog', { name: 'Dependent apps found!' })).not.toBeInTheDocument();
});

it('preserves typed Save metadata when refreshed lifecycle rows have the same identity', () => {
  const lifecycle = value();
  const form = (provided) => (
    <VersionLifecycleProvider value={provided}>
      <EditionSaveModal showCreateAppVersion setShowCreateAppVersion={() => {}} versionId={draft.id} />
    </VersionLifecycleProvider>
  );
  const view = render(form(lifecycle));
  fireEvent.change(cy('version-name-input-field'), { target: { value: 'Custom.Name' } });
  fireEvent.change(cy('version-description-input-field'), { target: { value: 'Typed description' } });
  view.rerender(form({ ...lifecycle, versions: [{ ...draft }, { ...saved }] }));
  expect(cy('version-name-input-field')).toHaveValue('Custom.Name');
  expect(cy('version-description-input-field')).toHaveValue('Typed description');
});
