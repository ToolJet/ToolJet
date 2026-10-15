import React, { useEffect, useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { appVersionService, appEnvironmentService } from '@/_services';
import { useVersionDiffStore } from './useVersionDiffStore';
import './versionDiff.scss';

// One line for a confirmation dialog: what this version changes compared with
// what the target audience runs today, and a button into the compare view.
// Used by the Promote step (compared with the newest version already in the
// target environment) and by Release (compared with the released version).

export const summarise = (diff) => {
  if (!diff) return null;
  if (diff.identical) return 'No differences';
  const { components, queries, pages } = diff.summary;
  const parts = [];
  const changedComponents = components.added + components.changed + components.removed;
  if (changedComponents)
    parts.push(
      `${changedComponents} component${changedComponents === 1 ? '' : 's'} on ${diff.pages.length} page${
        diff.pages.length === 1 ? '' : 's'
      }`
    );
  if (pages.added) parts.push(`${pages.added} new page${pages.added === 1 ? '' : 's'}`);
  if (pages.removed) parts.push(`${pages.removed} page${pages.removed === 1 ? '' : 's'} removed`);
  const changedQueries = queries.added + queries.changed + queries.removed;
  if (changedQueries) parts.push(`${changedQueries} quer${changedQueries === 1 ? 'y' : 'ies'}`);
  if (diff.settings.length) parts.push('app settings');
  return parts.length ? parts.join(', ') : 'No visible differences';
};

// The version people in the target environment use now: the released one in
// production, otherwise the most recently updated version already there. When
// nothing has reached that environment yet (a first promotion), fall back to
// the released version so the step still says what changes for users.
export const findBaseInEnvironment = async (appId, environment, releasedVersionId, excludeId) => {
  if (!environment) return null;
  const response = await appEnvironmentService.getVersionsByEnvironment(appId, environment.id);
  // The endpoint also returns versions that sit in later environments, so keep
  // only the ones whose own environment is the target.
  const versions = (response?.appVersions ?? []).filter(
    (version) =>
      version.id !== excludeId && (!version.currentEnvironmentId || version.currentEnvironmentId === environment.id)
  );
  const released = versions.find((version) => version.id === releasedVersionId);
  if (released) return { version: released, where: 'environment' };
  if (versions.length) {
    const newest = [...versions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    return { version: newest, where: 'environment' };
  }
  if (releasedVersionId && releasedVersionId !== excludeId) {
    const all = await appVersionService.getAll(appId);
    const releasedVersion = (all?.versions ?? []).find((version) => version.id === releasedVersionId);
    if (releasedVersion) return { version: releasedVersion, where: 'released' };
  }
  return null;
};

export const ChangeSummary = ({ appId, baseVersion, targetVersionId, source, label }) => {
  const openCompare = useVersionDiffStore((state) => state.openCompare);
  const [diff, setDiff] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!appId || !baseVersion?.id || !targetVersionId || baseVersion.id === targetVersionId) return;
    let cancelled = false;
    setDiff(null);
    setFailed(false);
    appVersionService
      .getDiff(appId, targetVersionId, baseVersion.id)
      .then((result) => !cancelled && setDiff(result))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [appId, baseVersion?.id, targetVersionId]);

  if (!baseVersion) return null;
  const counts = diff?.summary?.components;

  return (
    <div className="vd-dialog-summary" data-cy="dialog-change-summary">
      <div className="vd-dialog-summary__text">
        <span className="vd-dialog-summary__label">{label ?? `Changes from ${baseVersion.name}`}</span>
        <span className="vd-dialog-summary__value">
          {failed ? 'The comparison could not be loaded' : diff ? summarise(diff) : 'Comparing…'}
        </span>
        {counts && !diff.identical && (
          <span className="vd-dialog-summary__counts">
            {counts.added > 0 && <span className="vd-count vd-count--added">+{counts.added}</span>}
            {counts.changed > 0 && <span className="vd-count vd-count--changed">~{counts.changed}</span>}
            {counts.removed > 0 && <span className="vd-count vd-count--removed">−{counts.removed}</span>}
          </span>
        )}
      </div>
      <button
        type="button"
        className="vd-dialog-summary__button"
        onClick={() => openCompare({ baseVersionId: baseVersion.id, targetVersionId, source })}
        data-cy="review-changes-button"
      >
        <GitCompareArrows size={14} strokeWidth={1.75} aria-hidden="true" />
        Review changes
      </button>
    </div>
  );
};

export default ChangeSummary;
