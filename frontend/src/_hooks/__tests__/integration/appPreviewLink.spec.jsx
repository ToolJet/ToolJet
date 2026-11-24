import { act, renderHook } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { seedApp } from '@/test/app-builder';
import { useAppPreviewLink } from '../../useAppPreviewLink';

function loadEditor(versionName = 'feature-planner') {
  const state = seedApp({});
  state().setApp({ appId: 'planner-app', slug: 'weekly-planner' });
  state().setCurrentPageHandle('overview');
  state().setResolvedGlobals('appVersion', { name: versionName });
  state().updateEditingVersion('loaded-version-id');
  useWorkspaceBranchesStore.setState({ currentBranch: { id: 'planner-branch', name: 'feature-planner' } });
}

test('preview keeps the loaded version while the environment dropdown is initializing', () => {
  loadEditor();

  const { result } = renderHook(() => useAppPreviewLink());
  const link = new URL(result.current, 'http://localhost');

  expect(link.pathname).toBe('/applications/weekly-planner/overview');
  expect(link.searchParams.get('version')).toBe('feature-planner');
  expect(link.searchParams.get('branch')).toBe('feature-planner');
});

test('preview follows the loaded version when initialization has not supplied a selected version', () => {
  loadEditor('draft-one');
  const { result } = renderHook(() => useAppPreviewLink());

  act(() => {
    useStore.getState().setResolvedGlobals('appVersion', { name: 'draft-two' });
  });

  expect(new URL(result.current, 'http://localhost').searchParams.get('version')).toBe('draft-two');
});

test('a selected named version keeps precedence over the loaded version fallback', () => {
  loadEditor();
  useStore.getState().setSelectedVersion({ id: 'snapshot-id', name: 'review-snapshot' });
  useStore.getState().setSelectedEnvironment({ id: 'review-env', name: 'staging' });

  const { result } = renderHook(() => useAppPreviewLink());
  const link = new URL(result.current, 'http://localhost');

  expect(link.searchParams.get('version')).toBe('review-snapshot');
  expect(link.searchParams.get('env')).toBe('staging');
});
