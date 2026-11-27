import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

import { canCreateDataSource } from '@/_helpers/global-datasources';
import { isGitSyncLicenseInvalid } from '@/_helpers/gitSyncLicense';
import { globalDatasourceService } from '@/_services/globalDatasource.service';
import { useLicenseStore } from '@/_stores/licenseStore';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

import type { CatalogSource } from './catalog';

interface ManifestSourceData {
  kind?: string;
  options?: Record<string, { encrypted?: boolean }>;
}

interface ManifestFile {
  data?: {
    'tj:source'?: ManifestSourceData;
    source?: ManifestSourceData & { options?: Record<string, { encrypted?: boolean }> };
    'tj:encrypted'?: string[];
    defaults?: Record<string, DefaultOption>;
  };
}

interface DefaultOption {
  value?: unknown;
  credential_id?: string;
}

// Built-ins carry `defaults`/`options`; marketplace plugins carry them in a manifest file.
type CreatableSource = CatalogSource & {
  manifestFile?: ManifestFile;
  defaults?: Record<string, DefaultOption>;
  options?: Record<string, DefaultOption>;
};

const BRANCH_MISSING_MESSAGE =
  'Branch does not exist in git. Delete this branch and create a new one to continue to make changes.';

/** Maps a catalogue entry to the body `globalDatasourceService.create` expects. Mirrors the old data sources page. */
function toCreatePayload(dataSource: CreatableSource) {
  const manifest = dataSource.manifestFile?.data;
  const sourceMeta = (manifest?.['tj:source'] ?? manifest?.source ?? dataSource) as ManifestSourceData;
  const name = manifest?.['tj:source']?.kind ?? manifest?.source?.kind ?? dataSource.kind;
  const defaults: Record<string, DefaultOption> = dataSource.defaults ?? dataSource.options ?? manifest?.defaults ?? {};
  const encryptedKeys = new Set(manifest?.['tj:encrypted'] ?? []);

  const options = Object.keys(defaults).map((key) => {
    const keyMeta = sourceMeta.options?.[key];
    return {
      key,
      value: defaults[key]?.value,
      encrypted: keyMeta ? keyMeta.encrypted : encryptedKeys.has(key),
      ...(!defaults[key]?.value && { credential_id: defaults[key]?.credential_id }),
    };
  });

  return { name, plugin_id: dataSource.id, kind: sourceMeta.kind, options, scope: 'global', environment_id: undefined };
}

// Minimal views of the untyped JS stores; only what this hook reads.
interface BranchStoreState {
  isGitSyncConfigured: boolean;
  isInitialized: boolean;
  isMultiBranchingEnabled?: boolean;
  orgGitConfig?: { is_branching_enabled?: boolean; isBranchingEnabled?: boolean } | null;
  currentBranch?: { is_default?: boolean; isDefault?: boolean } | null;
}

interface UseDataSourceCreationOptions {
  onCreated?: (dataSource: unknown) => void;
}

export function useDataSourceCreation({ onCreated }: UseDataSourceCreationOptions = {}) {
  const [isCreating, setIsCreating] = useState(false);

  const isGitSyncConfigured = useWorkspaceBranchesStore((state: BranchStoreState) => state.isGitSyncConfigured);
  const licenseFeatureAccess = useLicenseStore((state: { featureAccess: unknown }) => state.featureAccess);
  // The license downgrade keeps `is_branching_enabled` true, so also require the multi-branch flag.
  const isBranchLockedOnDefault = useWorkspaceBranchesStore((state: BranchStoreState) => {
    if (!state.isInitialized || !state.orgGitConfig) return false;
    const isBranchingEnabled =
      (state.orgGitConfig?.is_branching_enabled || state.orgGitConfig?.isBranchingEnabled) &&
      state.isMultiBranchingEnabled !== false;
    const isDefault = state.currentBranch?.is_default || state.currentBranch?.isDefault;
    return !!(isBranchingEnabled && isDefault);
  });

  const hasCreatePermission = Boolean(canCreateDataSource());
  // An expired git-sync license makes the whole workspace read-only.
  const isGitLicenseLocked = isGitSyncConfigured && isGitSyncLicenseInvalid(licenseFeatureAccess);
  const isWorkspaceBranchLocked = isBranchLockedOnDefault || isGitLicenseLocked;

  const createDataSource = useCallback(
    async (source: CatalogSource) => {
      const { currentBranch, actions } = useWorkspaceBranchesStore.getState();
      if (currentBranch) {
        try {
          if (!(await actions.checkBranchExistsOnRemote(currentBranch.name))) {
            toast.error(BRANCH_MISSING_MESSAGE);
            return;
          }
        } catch {
          // A network error shouldn't block creation; the server validates the branch again.
        }
      }

      const payload = toCreatePayload(source as CreatableSource);
      if (!payload.name?.trim()) {
        toast.error('The name of datasource should not be empty', { position: 'top-center' });
        return;
      }

      setIsCreating(true);
      try {
        const created = await globalDatasourceService.create(payload);
        toast.success('Data Source Added', { position: 'top-center' });
        onCreated?.(created);
      } catch (error) {
        const message = (error as { error?: string })?.error;
        if (message) toast.error(message, { position: 'top-center' });
      } finally {
        setIsCreating(false);
      }
    },
    [onCreated]
  );

  return { createDataSource, isCreating, hasCreatePermission, isGitLicenseLocked, isWorkspaceBranchLocked };
}
