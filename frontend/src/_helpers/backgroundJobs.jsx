import React from 'react';
import { GitBranch, Layers } from 'lucide-react';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

// Branch and version creates finish on a background worker and announce themselves through a live
// notification. While the modal that started the create is still open it takes the notification
// and switches automatically; once it is closed, the notification's toast offers a switch button.

const BRANCH = 'branch';
const VERSION = 'version';

export const JOB_COPY = {
  branchStarted: 'This might take a few minutes we will notify you once the branch is created',
  branchImportStarted: 'This might take a few minutes we will notify you once the branch is imported',
  branchCreated: 'Branch created successfully!',
  branchImported: 'Branch imported successfully!',
  versionStarted: 'This might take a few minutes we will notify you once the draft version is created',
  versionCreated: 'Draft version created successfully!',
};

export const branchJobKey = (branchName) => `${BRANCH}:${branchName}`;
export const versionJobKey = (appId, versionName) => `${VERSION}:${appId}:${versionName}`;

function jobOf(metadata) {
  if (metadata?.source === 'git-sync' && metadata.action === 'git-create-branch') {
    return { kind: BRANCH, key: branchJobKey(metadata.branchName) };
  }
  if (metadata?.source === 'app-version' && metadata.action === 'version-create') {
    return { kind: VERSION, key: versionJobKey(metadata.appId, metadata.versionName) };
  }
  return null;
}

// Editor route at the version's name — the editor resolves `?version=` on load.
export function versionLink(metadata) {
  const workspace = window.location.pathname.split('/')[1];
  return `/${workspace}/apps/${metadata.appId}?version=${encodeURIComponent(metadata.versionName)}`;
}

const waitingModals = new Map();

// Call from the modal once the create is accepted. Returns the function to call when the modal closes.
export function waitForJob(key, onSettled) {
  waitingModals.set(key, onSettled);
  return () => {
    if (waitingModals.get(key) === onSettled) waitingModals.delete(key);
  };
}

// Hands a job notification to the modal waiting on it. Returns true when the modal took over the
// success toast; failures still get the generic error toast.
export function settleWaitingModal(notification) {
  // the "started" notification (info) carries the same metadata — only an outcome settles the modal
  if (notification?.type !== 'success' && notification?.type !== 'error') return false;
  const job = jobOf(notification.metadata);
  const onSettled = job && waitingModals.get(job.key);
  if (!onSettled) return false;
  waitingModals.delete(job.key);
  onSettled(notification);
  return notification.type === 'success';
}

// Defaults work from any page; the editor registers overrides that keep the current app open.
const defaultSwitchers = {
  [BRANCH]: async (metadata) => {
    const actions = useWorkspaceBranchesStore.getState().actions;
    await actions.fetchBranches();
    await actions.switchBranch(metadata.branchId);
  },
  [VERSION]: (metadata) => window.location.assign(versionLink(metadata)),
};
const switchers = new Map();

export function registerJobSwitcher(kind, switcher) {
  switchers.set(kind, switcher);
  return () => {
    if (switchers.get(kind) === switcher) switchers.delete(kind);
  };
}

export const JOB_KINDS = { BRANCH, VERSION };

// Lets open pickers (e.g. the switch-branch modal) close once the toast has switched for the user.
const switchListeners = new Set();
export function onJobSwitch(listener) {
  switchListeners.add(listener);
  return () => switchListeners.delete(listener);
}
const runSwitch = async (switcher, metadata) => {
  await switcher(metadata);
  switchListeners.forEach((listener) => listener());
};

// Toast for a finished create — design copy plus the switch action — or null when the
// notification isn't one.
export function jobToastFor(notification) {
  const metadata = notification?.metadata;
  const job = notification?.type === 'success' && jobOf(metadata);
  if (!job) return null;
  const switcher = switchers.get(job.kind) ?? defaultSwitchers[job.kind];
  if (job.kind === BRANCH) {
    return {
      message: metadata.isImport ? JOB_COPY.branchImported : JOB_COPY.branchCreated,
      action: metadata.branchId && {
        label: 'Switch branch',
        icon: <GitBranch className="tw-size-4 tw-text-icon-brand" />,
        accent: true,
        onClick: () => runSwitch(switcher, metadata),
      },
    };
  }
  return {
    message: JOB_COPY.versionCreated,
    action: {
      label: 'Switch to version',
      icon: <Layers className="tw-size-4 tw-text-icon-brand" />,
      accent: true,
      onClick: () => runSwitch(switcher, metadata),
    },
  };
}
