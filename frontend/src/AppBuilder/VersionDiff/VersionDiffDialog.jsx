import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import {
  ArrowRight,
  ChevronDown,
  Columns2,
  Database,
  LayoutTemplate,
  GitCompareArrows,
  GitPullRequestArrow,
  Monitor,
  Smartphone,
  SquareSplitHorizontal,
  Undo2,
  X,
} from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { appVersionService, authenticationService } from '@/_services';
import { getSubpath } from '@/_helpers/routes';
import { authHeader } from '@/_helpers';
import config from 'config';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Button,
  ToggleGroup,
  ToggleGroupItem,
  Tabs,
  TabsList,
  TabsTrigger,
  selectTriggerVariants,
} from '@/components/ui/Rocket';
import { useVersionDiffStore } from './useVersionDiffStore';
import { ChangeList, STATUS_WORD, typeLabel } from './ChangeList';
import { VersionFrame } from './VersionFrame';
import { BlueprintFrame } from './BlueprintFrame';
import { ReviewPanel, RequestReviewForm, REVIEW_STATUS } from './ReviewPanel';
import { reviewService } from './reviewService';
import { Divider, StatusDot, STATUS_TONE, Tag } from './ui';
import './versionDiff.scss';

const SNAPSHOT = '__snapshot__';

// The version menu's own tags: Draft in amber, Released in green, nothing for a saved version.
const versionTag = (version, releasedVersionId) =>
  version?.id === releasedVersionId ? (
    <Tag tone="success">Released</Tag>
  ) : version?.status === 'DRAFT' ? (
    <Tag tone="warning">Draft</Tag>
  ) : null;

const VersionSelect = ({ label, value, versions, onChange, releasedVersionId, disabledId, snapshotLabel }) => {
  const version = versions.find((item) => item.id === value);
  const isSnapshot = value === SNAPSHOT;
  return (
    <label
      className="vd-picker tw-relative tw-m-0 tw-flex tw-items-center tw-gap-2"
      title={isSnapshot ? snapshotLabel : version?.name}
    >
      <span className="tw-font-body-default tw-text-text-placeholder">{label}</span>
      <span
        className={cn(
          selectTriggerVariants({ size: 'default' }),
          'vd-picker__trigger tw-flex tw-items-center tw-w-[184px] tw-gap-2 tw-rounded-md tw-border'
        )}
      >
        <span className="tw-min-w-0 tw-truncate tw-font-title-default tw-text-text-default">
          {isSnapshot ? snapshotLabel : version?.name ?? 'Choose a version'}
        </span>
        {!isSnapshot && versionTag(version, releasedVersionId)}
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className="tw-ml-auto tw-shrink-0 tw-text-icon-default"
          aria-hidden="true"
        />
      </span>
      {/* A native select over the trigger: the menu opens above the full-screen dialog and works with the keyboard. */}
      <select
        className="tw-absolute tw-right-0 tw-top-0 tw-h-full tw-w-[184px] tw-opacity-0 tw-cursor-pointer"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {snapshotLabel && <option value={SNAPSHOT}>{snapshotLabel}</option>}
        {versions.map((item) => (
          <option key={item.id} value={item.id} disabled={item.id === disabledId}>
            {item.name}
            {item.id === releasedVersionId ? ' (released)' : item.status === 'DRAFT' ? ' (draft)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
};

// Icon-only choices, as in the editor header's desktop and mobile switch.
const IconChoice = ({ label, value, onChange, options }) => (
  <ToggleGroup type="single" value={value} onValueChange={(next) => next && onChange(next)} aria-label={label}>
    {options.map(({ id, text, Icon }) => (
      <ToggleGroupItem
        key={id}
        value={id}
        aria-label={text}
        data-tip={text}
        className="vd-seg__opt tw-w-7 tw-text-icon-default [&_svg]:!tw-text-icon-default data-[state=on]:[&_svg]:!tw-text-icon-strong hover:[&_svg]:!tw-text-icon-strong"
      >
        <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);

// Picks the version most worth comparing against: the one this version was
// copied from, else the released one, else the newest other version.
const defaultBase = (target, versions, releasedVersionId) => {
  if (!target) return null;
  const candidates = [target.parentVersionId, releasedVersionId].filter((id) => id && id !== target.id);
  const found = candidates.find((id) => versions.some((version) => version.id === id));
  if (found) return found;
  return versions.find((version) => version.id !== target.id)?.id ?? null;
};

const SOURCE_COPY = {
  header: 'Compare versions',
  release: 'Review before release',
  promote: 'Review before promoting',
  ai: 'What the AI edit changed',
  review: 'Review changes',
};

export const VersionDiffDialog = ({ darkMode }) => {
  const { moduleId } = useModuleContext();
  const { isOpen, baseVersionId, targetVersionId, source, reviewId, baseSnapshotId, undo, closeCompare } =
    useVersionDiffStore();
  const { appId, slug, selectedVersion, releasedVersionId, environments } = useStore(
    (state) => ({
      appId: state.appStore.modules[moduleId]?.app?.appId,
      slug: state.appStore.modules[moduleId]?.app?.slug,
      selectedVersion: state.selectedVersion,
      releasedVersionId: state.releasedVersionId,
      environments: state.environments,
    }),
    shallow
  );

  const [versions, setVersions] = useState([]);
  const [pair, setPair] = useState({ base: null, target: null });
  const [diff, setDiff] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageKey, setPageKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [hover, setHover] = useState(null);
  const [filter, setFilter] = useState('all');
  const [mode, setMode] = useState('split');
  const [viewport, setViewport] = useState('desktop');
  const [scroll, setScroll] = useState(null);
  const [found, setFound] = useState({ base: new Set(), target: new Set() });
  const [review, setReview] = useState(null);
  const [panel, setPanel] = useState(null);
  const [snapshotId, setSnapshotId] = useState(null);
  const [renderMode, setRenderMode] = useState('live');
  const [undoState, setUndoState] = useState(null); // null | 'confirm' | 'working' | { error }
  const [reloadKey, setReloadKey] = useState(0);
  const [errorStatus, setErrorStatus] = useState(null);
  const [frameEnvs, setFrameEnvs] = useState({}); // versionId -> { env, own }
  const closeRef = useRef(null);
  const loadedPairRef = useRef(null);
  const pairTargetRef = useRef(null);
  pairTargetRef.current = pair.target;
  const undoStateRef = useRef(null);
  undoStateRef.current = undoState;
  const session = authenticationService.currentSessionValue;
  const currentUser = {
    id: session?.current_user?.id,
    isAdmin: !!(session?.admin || session?.super_admin || session?.role?.name === 'admin'),
  };

  useEffect(() => {
    if (!isOpen || !appId) return;
    let cancelled = false;
    appVersionService
      .getAll(appId)
      .then(async ({ versions: list = [] }) => {
        if (cancelled) return;
        const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setVersions(sorted);
        if (reviewId) {
          const { review: opened } = await reviewService.get(appId, reviewId);
          if (cancelled) return;
          setSnapshotId(null);
          setReview(opened);
          setPanel('review');
          setPair({
            target: opened.versionId,
            base:
              opened.baseVersionId ??
              defaultBase(
                sorted.find((v) => v.id === opened.versionId),
                sorted,
                releasedVersionId
              ),
          });
          return;
        }
        const target = sorted.find((version) => version.id === (targetVersionId ?? selectedVersion?.id)) ?? sorted[0];
        setSnapshotId(baseSnapshotId);
        setPair({
          target: target?.id ?? null,
          base: baseSnapshotId ? null : baseVersionId ?? defaultBase(target, sorted, releasedVersionId),
        });
      })
      .catch((err) => !cancelled && setError(err?.error ?? 'Versions could not be loaded'));
    return () => {
      cancelled = true;
    };
  }, [isOpen, appId, baseVersionId, targetVersionId, reviewId, baseSnapshotId, selectedVersion?.id, releasedVersionId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!pair.target || (!snapshotId && (!pair.base || pair.base === pair.target))) {
      // Nothing to compare yet (or one version only): never leave an earlier comparison on screen.
      setDiff(null);
      setPageKey(null);
      return;
    }
    let cancelled = false;
    // A new pair starts from a blank comparison; a refresh of the same pair (after a
    // review conflict) keeps the current one on screen, review panel included.
    const pairKey = `${pair.base}|${pair.target}|${snapshotId}`;
    if (loadedPairRef.current !== pairKey) setDiff(null);
    loadedPairRef.current = pairKey;
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    appVersionService
      .getDiff(appId, pair.target, pair.base, snapshotId)
      .then((result) => {
        if (cancelled) return;
        setDiff(result);
        setSelectedKey(null);
        setFilter('all');
        setScroll(null);
        setFound({ base: new Set(), target: new Set() });
        const firstPage = result.pages.find((page) => page.components.length) ?? result.pages[0];
        setPageKey(firstPage?.key ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setDiff(null);
        setErrorStatus(err?.statusCode ?? null);
        setError(
          err?.statusCode === 410
            ? err?.error ?? 'This edit is too old to compare.'
            : err?.error ?? err?.message ?? 'The comparison could not be loaded'
        );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, appId, pair.base, pair.target, snapshotId, reloadKey]);

  // The review attached to the version being compared, if there is one.
  useEffect(() => {
    if (!isOpen || !appId || !pair.target) return;
    if (review?.versionId === pair.target) return;
    let cancelled = false;
    setReview(null);
    reviewService
      .list(appId)
      .then(async ({ reviews = [] }) => {
        const match =
          reviews.find((item) => item.versionId === pair.target && item.status === 'open') ??
          reviews.find((item) => item.versionId === pair.target);
        if (!match || cancelled) return;
        const { review: full } = await reviewService.get(appId, match.id);
        if (!cancelled) acceptReview(full);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, appId, pair.target]); // eslint-disable-line react-hooks/exhaustive-deps

  // Each opening starts clean: no review, snapshot or comparison carried over from the last one.
  useEffect(() => {
    if (isOpen) return;
    loadedPairRef.current = null;
    setFrameEnvs({});
    setReview(null);
    setPanel(null);
    setUndoState(null);
    setSnapshotId(null);
    setDiff(null);
    setError(null);
    setPageKey(null);
    setSelectedKey(null);
    setPair({ base: null, target: null });
    setFound({ base: new Set(), target: new Set() });
  }, [isOpen]);

  // A review loaded for another pair (a late response) is dropped.
  const acceptReview = useCallback(
    (next) => setReview(next && pairTargetRef.current && next.versionId !== pairTargetRef.current ? null : next),
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      // Escape in a field with text clears nothing and closes nothing: a half-written comment survives.
      const field = event.target?.closest?.('textarea, input');
      if (field && field.value) return;
      if (undoStateRef.current) return setUndoState(null);
      closeCompare();
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      // Back to whatever opened the compare view.
      if (opener?.isConnected) opener.focus?.();
    };
  }, [isOpen, closeCompare]);

  const versionById = useMemo(() => new Map(versions.map((version) => [version.id, version])), [versions]);
  const page = diff?.pages.find((item) => item.key === pageKey) ?? null;

  // The viewer renders a version by name; with a snapshot id it renders the
  // version as that snapshot had it, queries included, without changing anything.
  // Which environment each version renders in: its own when the user may preview it there,
  // else the first one that lets them (builders cannot preview production). Asked once per
  // version, with the same check the viewer runs, so a frame never sits on a refused page.
  useEffect(() => {
    if (!isOpen || !appId) return;
    const ids = [pair.base, pair.target].filter((id) => id && !frameEnvs[id] && versionById.get(id));
    if (!ids.length) return;
    let cancelled = false;
    const ordered = [...(environments ?? [])].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    const canView = (versionName, environmentName) =>
      fetch(
        `${config.apiUrl}/apps/validate-private-app-access/${encodeURIComponent(slug || appId)}?access_type=view` +
          `&environment_name=${encodeURIComponent(environmentName)}&version_name=${encodeURIComponent(versionName)}`,
        { headers: authHeader(), credentials: 'include' }
      )
        .then((response) => response.ok)
        .catch(() => false);
    Promise.all(
      ids.map(async (id) => {
        const version = versionById.get(id);
        const own = ordered.find((item) => item.id === version.currentEnvironmentId)?.name;
        const candidates = [own, ...ordered.map((item) => item.name).filter((name) => name !== own)].filter(Boolean);
        for (const name of candidates) if (await canView(version.name, name)) return [id, { env: name, own }];
        return [id, { env: own, own }];
      })
    ).then((entries) => !cancelled && setFrameEnvs((prev) => ({ ...prev, ...Object.fromEntries(entries) })));
    return () => {
      cancelled = true;
    };
  }, [isOpen, appId, slug, pair.base, pair.target, versionById, environments]); // eslint-disable-line react-hooks/exhaustive-deps

  const frameSrc = useCallback(
    (versionId, snapshot) => {
      const version = versionById.get(versionId);
      if (!version || !pageKey) return null;
      // Without environments (no multi-environment license) the viewer picks its own.
      if (environments?.length && !frameEnvs[versionId]) return null;
      const env = frameEnvs[versionId]?.env;
      // encodeURIComponent, not URLSearchParams: the viewer decodes %20 but reads + literally.
      const query = [
        ['version', version.name],
        ...(env ? [['env', env]] : []),
        ...(snapshot ? [['snapshot', snapshot]] : []),
      ]
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      return `${getSubpath() ?? ''}/applications/${encodeURIComponent(slug || appId)}/${encodeURIComponent(
        pageKey
      )}?${query}`;
    },
    [versionById, environments, slug, appId, pageKey, frameEnvs]
  );
  const fallbackEnv = (versionId) => {
    const entry = frameEnvs[versionId];
    return entry && entry.own && entry.env !== entry.own ? entry.env : null;
  };

  const highlights = useMemo(() => {
    // A container whose only change is the order of its children would
    // otherwise outline the whole page. It gets a light dashed outline.
    const components = (page?.components ?? []).map((component) => ({
      ...component,
      weak:
        component.status === 'changed' &&
        component.events.length === 0 &&
        component.changes.every((change) => change.path === 'properties.childOrder' || change.group === 'layout') &&
        page.components.some((child) => child.parent.target === component.name || child.parent.base === component.name),
    }));
    const pick = (component, id) => ({
      id,
      key: component.key,
      name: component.name,
      status: component.status,
      weak: component.weak,
    });
    return {
      base: components
        .filter((component) => component.status !== 'added')
        .map((component) => pick(component, component.baseId)),
      target: components
        .filter((component) => component.status !== 'removed')
        .map((component) => pick(component, component.targetId)),
    };
  }, [page]);

  const hiddenKeys = useMemo(() => {
    const keys = new Set();
    for (const component of page?.components ?? []) {
      const inBase = component.status === 'added' || found.base.has(component.key);
      const inTarget = component.status === 'removed' || found.target.has(component.key);
      if (!inBase || !inTarget) keys.add(component.key);
    }
    return keys;
  }, [page, found]);

  const commentCounts = useMemo(() => {
    const counts = {};
    for (const event of review?.timeline ?? [])
      if (event.kind === 'comment' && event.anchor) counts[event.anchor] = (counts[event.anchor] ?? 0) + 1;
    return counts;
  }, [review]);

  const selectedComponent = page?.components.find((component) => component.key === selectedKey) ?? null;

  const goToAnchor = useCallback(
    (anchor) => {
      const pageKeyOfAnchor = anchor.split('/')[0];
      if (diff?.pages.some((item) => item.key === pageKeyOfAnchor)) setPageKey(pageKeyOfAnchor);
      setFilter('all');
      setSelectedKey(anchor);
    },
    [diff]
  );

  const onFoundBase = useCallback(
    (keys) => setFound((prev) => (sameSet(prev.base, keys) ? prev : { ...prev, base: keys })),
    []
  );
  const onFoundTarget = useCallback(
    (keys) => setFound((prev) => (sameSet(prev.target, keys) ? prev : { ...prev, target: keys })),
    []
  );
  const onHover = useCallback((key, point) => setHover(key ? { key, ...(point ?? {}) } : null), []);
  const onSelect = useCallback((key, inPage) => {
    setSelectedKey(key);
    if (inPage) setPageKey(inPage);
  }, []);

  if (!isOpen) return null;

  const showPanel = !!diff && ((panel === 'review' && !!review) || (panel === 'create' && !review));
  const title = review
    ? SOURCE_COPY.review
    : snapshotId
    ? SOURCE_COPY.ai
    : SOURCE_COPY[source === 'review' || source === 'ai' ? 'header' : source] ?? SOURCE_COPY.header;
  const snapshotLabel = snapshotId ? 'Before the AI edit' : null;

  const pickTarget = (id) => {
    const target = versionById.get(id);
    // A snapshot belongs to one version: picking another leaves the AI-edit comparison.
    const leavingSnapshot = !!snapshotId && id !== pair.target;
    if (leavingSnapshot) setSnapshotId(null);
    setPair((prev) => ({
      target: id,
      base:
        leavingSnapshot || !prev.base || prev.base === id
          ? defaultBase(target, versions, releasedVersionId)
          : prev.base,
    }));
  };
  const runUndo = async () => {
    setUndoState('working');
    try {
      await appVersionService.restoreSnapshot(appId, snapshotId, undo?.expectedFingerprint);
      toast.success('Undid the AI edit. The state before the undo is kept, so it can be restored.');
      setUndoState(null);
      closeCompare();
      useStore.getState().triggerHotReload?.();
    } catch (err) {
      setUndoState({ error: err?.error ?? err?.message ?? 'The edit could not be undone' });
    }
  };

  const swap = () => !snapshotId && setPair((prev) => ({ base: prev.target, target: prev.base }));
  const pickBase = (id) => {
    if (id === SNAPSHOT) return;
    setSnapshotId(null);
    setPair((prev) => ({ ...prev, base: id }));
  };

  const hovered = hover && page?.components.find((component) => component.key === hover.key);
  const targetName = diff?.target.name ?? versionById.get(pair.target)?.name;
  const baseName = snapshotId ? targetName : diff?.base.name ?? versionById.get(pair.base)?.name;
  const layoutOnly = renderMode === 'layout';
  // Undo checks the version against the fingerprint the turn ended on; one recorded under
  // other rules cannot be checked, and the server would refuse.
  const undoCheckable =
    !!undo?.expectedFingerprint && undo.expectedFingerprint.split(':')[0] === diff?.target?.fingerprint?.split(':')[0];

  const frames = page && (
    <Stage
      mode={mode}
      base={{
        name: baseName,
        tag: snapshotId ? 'Before the AI edit' : 'Before',
        missing: page.status === 'added',
        note: fallbackEnv(snapshotId ? pair.target : pair.base),
        src: snapshotId ? frameSrc(pair.target, snapshotId) : frameSrc(pair.base),
        highlights: highlights.base,
        onFound: onFoundBase,
        blueprint: layoutOnly
          ? { appId, pageKey, source: snapshotId ? { snapshotId } : { versionId: pair.base } }
          : null,
      }}
      target={{
        name: targetName,
        tag: snapshotId ? 'Now' : 'After',
        missing: page.status === 'removed',
        note: fallbackEnv(pair.target),
        src: frameSrc(pair.target),
        highlights: highlights.target,
        onFound: onFoundTarget,
        blueprint: layoutOnly ? { appId, pageKey, source: { versionId: pair.target } } : null,
      }}
      shared={{
        viewport,
        selectedKey,
        hoveredKey: hover?.key ?? null,
        onSelect: (key) => setSelectedKey(key),
        onHover,
        syncScroll: scroll,
        onScrollChange: setScroll,
        onEscape: closeCompare,
      }}
    />
  );

  return createPortal(
    <div
      className={cx('vd-root', { 'dark-theme theme-dark': darkMode })}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header className="vd-head tw-flex tw-items-center tw-gap-4 tw-px-4 tw-bg-background-surface-layer-01 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
        <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0 tw-flex-1">
          <GitCompareArrows
            size={16}
            strokeWidth={1.75}
            className="tw-shrink-0 tw-text-icon-default"
            aria-hidden="true"
          />
          <h2 className="tw-m-0 tw-truncate tw-font-title-large tw-text-text-default">{title}</h2>
          <Tag tone="accent" className="vd-beta">
            Beta
          </Tag>
        </div>

        <div className="tw-flex tw-items-center tw-gap-2">
          <VersionSelect
            label="From"
            value={snapshotId ? SNAPSHOT : pair.base}
            versions={versions}
            onChange={pickBase}
            snapshotLabel={snapshotLabel}
            releasedVersionId={releasedVersionId}
            disabledId={pair.target}
          />
          <Button
            variant="ghost"
            size="default"
            iconOnly
            onClick={swap}
            disabled={!!snapshotId}
            aria-label="Swap the two versions"
            data-tip={snapshotId ? undefined : 'Swap'}
          >
            <ArrowRight size={14} strokeWidth={1.75} className="tw-text-icon-default" />
          </Button>
          <VersionSelect
            label="To"
            value={pair.target}
            versions={versions}
            onChange={pickTarget}
            releasedVersionId={releasedVersionId}
            disabledId={pair.base}
          />
        </div>

        <div className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-flex-1">
          {snapshotId && undo && diff && !diff.identical && (
            <div className="tw-relative">
              <Button
                variant="outline"
                size="default"
                leadingVisual={<Undo2 size={14} strokeWidth={1.75} />}
                onClick={() => setUndoState(undoState ? null : 'confirm')}
                aria-expanded={!!undoState}
                disabled={!undoCheckable}
                data-tip={undoCheckable ? undefined : 'Recorded before an update, so it cannot be undone safely'}
                data-cy="undo-ai-edit"
              >
                Undo this edit
              </Button>
              {undoState && (
                <div
                  className="vd-undo__pop tw-absolute tw-right-0 tw-top-10 tw-z-10 tw-w-[300px] tw-p-4 tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-bg-background-surface-layer-01 tw-border tw-border-solid tw-border-border-weak tw-shadow-elevation-400"
                  role="dialog"
                  aria-label="Undo the AI edit"
                >
                  <div className="tw-flex tw-flex-col tw-gap-1">
                    <p className="tw-m-0 tw-font-title-default tw-text-text-default">
                      Put {targetName} back to before the AI edit?
                    </p>
                    <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder">
                      Everything changed on {targetName} since this AI edit started is reversed, including edits made
                      while it ran. The current state is kept, so you can restore it later.
                    </p>
                  </div>
                  {undoState?.error && (
                    <p className="tw-m-0 tw-font-body-small tw-text-text-danger">{String(undoState.error)}</p>
                  )}
                  <div className="tw-flex tw-justify-end tw-gap-2">
                    <Button variant="outline" size="medium" onClick={() => setUndoState(null)}>
                      {undoState?.error ? 'Close' : 'Cancel'}
                    </Button>
                    {!undoState?.error && (
                      <Button
                        variant="primary"
                        danger
                        size="medium"
                        onClick={runUndo}
                        loading={undoState === 'working'}
                        data-cy="confirm-undo-ai-edit"
                      >
                        Undo edit
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {review ? (
            <Button
              variant="outline"
              size="default"
              className={cn('vd-review-toggle', { 'tw-bg-interactive-selected': panel === 'review' })}
              leadingVisual={<GitPullRequestArrow size={14} strokeWidth={1.75} />}
              trailingVisual={
                <Tag tone={REVIEW_STATUS[review.state.status]?.tone}>{REVIEW_STATUS[review.state.status]?.label}</Tag>
              }
              onClick={() => setPanel(panel === 'review' ? null : 'review')}
              aria-pressed={panel === 'review'}
            >
              Review
            </Button>
          ) : (
            pair.target &&
            pair.base &&
            !snapshotId && (
              <Button
                variant="outline"
                size="default"
                className="vd-review-toggle"
                leadingVisual={<GitPullRequestArrow size={14} strokeWidth={1.75} />}
                onClick={() => setPanel('create')}
              >
                Request review
              </Button>
            )
          )}
          <Divider />
          <IconChoice
            label="Screen size"
            value={viewport}
            onChange={setViewport}
            options={[
              { id: 'desktop', text: 'Desktop', Icon: Monitor },
              { id: 'mobile', text: 'Mobile', Icon: Smartphone },
            ]}
          />
          <IconChoice
            label="Layout"
            value={mode}
            onChange={setMode}
            options={[
              { id: 'split', text: 'Side by side', Icon: Columns2 },
              { id: 'swipe', text: 'Swipe', Icon: SquareSplitHorizontal },
            ]}
          />
          <IconChoice
            label="Render"
            value={renderMode}
            onChange={setRenderMode}
            options={[
              { id: 'live', text: 'Live data', Icon: Database },
              { id: 'layout', text: 'Layout only, runs no queries', Icon: LayoutTemplate },
            ]}
          />
          <Divider />
          <Button
            ref={closeRef}
            variant="ghost"
            size="default"
            iconOnly
            className="vd-close"
            onClick={closeCompare}
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.75} className="tw-text-icon-default" />
          </Button>
        </div>
      </header>

      <div className={cx('vd-body', { 'vd-body--panel': showPanel })}>
        {error && (
          <div className="vd-state">
            {errorStatus === 410 ? (
              <Calm title="This edit is too old to compare">
                ToolJet keeps the last 100 AI edits of each version, and none once a version is deleted. Compare two
                versions instead.
              </Calm>
            ) : (
              <Calm title="The comparison could not be loaded">
                {String(error)}
                <span className="tw-block tw-mt-3">
                  <Button variant="outline" size="medium" onClick={() => setReloadKey((n) => n + 1)}>
                    Try again
                  </Button>
                </span>
              </Calm>
            )}
          </div>
        )}
        {loading && diff && <div className="vd-refreshing" aria-hidden="true" />}
        {!error && !diff && (
          <div className="vd-state tw-font-body-default tw-text-text-placeholder">
            Comparing {baseName ?? '…'} with {targetName ?? '…'}
          </div>
        )}
        {!error && diff && (
          <>
            <ChangeList
              diff={diff}
              filter={filter}
              onFilter={setFilter}
              pageKey={pageKey}
              onPageSelect={(key) => {
                setPageKey(key);
                setSelectedKey(null);
                setScroll(null);
              }}
              selectedKey={selectedKey}
              onSelect={onSelect}
              hoveredKey={hover?.key ?? null}
              onHover={(key) => setHover(key ? { key } : null)}
              hiddenKeys={hiddenKeys}
              commentCounts={commentCounts}
            />
            <main className="vd-stage-wrap tw-flex tw-flex-col tw-min-w-0 tw-min-h-0 tw-bg-page-weak">
              {diff.pages.length > 1 && (
                <Tabs
                  value={pageKey ?? undefined}
                  onValueChange={(key) => {
                    setPageKey(key);
                    setSelectedKey(null);
                    setScroll(null);
                  }}
                  className="tw-shrink-0 tw-px-4 tw-bg-background-surface-layer-01 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak"
                >
                  <TabsList variant="underline" className="vd-pages tw-border-b-0" aria-label="Changed pages">
                    {diff.pages.map((item) => (
                      <TabsTrigger key={item.key} value={item.key} className="vd-pages__tab tw-px-2">
                        {item.name}
                        {item.status !== 'changed' ? (
                          <Tag tone={STATUS_TONE[item.status]}>{STATUS_WORD[item.status]}</Tag>
                        ) : (
                          <span className="tw-font-body-small tw-text-text-placeholder">
                            {item.counts.added + item.counts.changed + item.counts.removed}
                          </span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
              <div className="tw-flex-1 tw-min-h-0 tw-p-4">
                {diff.identical ? (
                  <Calm title="No differences">
                    {targetName} has the same pages, components, queries and settings as {baseName}.
                  </Calm>
                ) : page ? (
                  frames
                ) : (
                  <Calm title="No page changes">
                    The differences are in queries or app settings. They are listed on the left.
                  </Calm>
                )}
              </div>
            </main>
            {panel === 'review' && review && (
              <ReviewPanel
                appId={appId}
                review={review}
                currentUser={currentUser}
                anchor={selectedComponent ? { key: selectedComponent.key, name: selectedComponent.name } : null}
                onClearAnchor={() => setSelectedKey(null)}
                onAnchor={goToAnchor}
                onChange={acceptReview}
                reviewedFingerprint={diff?.target?.fingerprint}
                onStale={() => setReloadKey((n) => n + 1)}
                onClose={() => setPanel(null)}
              />
            )}
            {panel === 'create' && !review && (
              <RequestReviewForm
                key={pair.target}
                appId={appId}
                targetVersion={versionById.get(pair.target)}
                baseVersion={versionById.get(pair.base)}
                onCreated={(created) => {
                  setReview(created);
                  setPanel('review');
                }}
                onCancel={() => setPanel(null)}
              />
            )}
          </>
        )}
      </div>

      {hovered && hover.x != null && (
        <div
          className="vd-card tw-fixed tw-w-[300px] tw-p-3 tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-bg-background-surface-layer-01 tw-border tw-border-solid tw-border-border-weak tw-shadow-elevation-400 tw-pointer-events-none"
          style={{
            left: Math.min(hover.x + 16, window.innerWidth - 316),
            top: Math.min(hover.y + 16, window.innerHeight - 180),
          }}
          role="tooltip"
        >
          <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
            <StatusDot status={hovered.status} />
            <span className="tw-min-w-0 tw-truncate tw-font-title-default tw-text-text-default">{hovered.name}</span>
            <span className="tw-ml-auto tw-shrink-0 tw-font-body-small tw-text-text-placeholder">
              {typeLabel(hovered.type)}
            </span>
          </div>
          {hovered.status === 'changed' ? (
            <ul className="tw-m-0 tw-p-0 tw-list-none tw-flex tw-flex-col tw-gap-1">
              {[...hovered.changes.map((change) => change.summary), ...hovered.events.map((event) => event.summary)]
                .slice(0, 5)
                .map((line, index) => (
                  <li key={index} className="tw-font-body-small tw-text-text-medium">
                    {line}
                  </li>
                ))}
              {hovered.changes.length + hovered.events.length > 5 && (
                <li className="tw-font-body-small tw-text-text-placeholder">
                  {hovered.changes.length + hovered.events.length - 5} more in the list
                </li>
              )}
            </ul>
          ) : (
            <p className="tw-m-0 tw-font-body-small tw-text-text-medium">
              {hovered.status === 'added' ? `New in ${targetName}` : `Removed in ${targetName}`}
            </p>
          )}
        </div>
      )}
    </div>,
    document.body
  );
};

const sameSet = (a, b) => a.size === b.size && [...a].every((key) => b.has(key));

const Calm = ({ title, children }) => (
  <div className="tw-h-full tw-grid tw-place-content-center tw-text-center tw-gap-1">
    <p className="tw-m-0 tw-font-title-large tw-text-text-default">{title}</p>
    <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder tw-max-w-[360px]">{children}</p>
  </div>
);

const SideFrame = ({ shared, side }) =>
  side.blueprint ? (
    <BlueprintFrame
      {...side.blueprint}
      viewport={shared.viewport}
      highlights={side.highlights}
      selectedKey={shared.selectedKey}
      hoveredKey={shared.hoveredKey}
      onSelect={shared.onSelect}
      onHover={shared.onHover}
      onFound={side.onFound}
    />
  ) : (
    <VersionFrame {...shared} {...side} />
  );

const FrameLabel = ({ side, floating }) => (
  <div
    className={cn('vd-label tw-flex tw-items-center tw-gap-2', {
      'tw-absolute tw-top-3 tw-z-[3] tw-h-7 tw-px-2 tw-rounded-md tw-bg-background-surface-layer-01 tw-border tw-border-solid tw-border-border-weak tw-shadow-elevation-100 tw-pointer-events-none':
        floating,
      'vd-label--base tw-left-3': floating === 'base',
      'vd-label--target tw-right-3': floating === 'target',
    })}
  >
    <span className="tw-font-title-default tw-text-text-default">{side.name}</span>
    <Tag>{side.tag}</Tag>
    {side.note && (
      <span
        className="tw-font-body-small tw-text-text-placeholder"
        data-tip={`You cannot preview this version where it runs, so it is shown with ${side.note} data`}
      >
        With {side.note} data
      </span>
    )}
  </div>
);

const Missing = ({ side, isBase }) => (
  <div className="tw-flex-1 tw-grid tw-place-content-center tw-gap-0.5 tw-text-center tw-rounded-lg tw-border tw-border-dashed tw-border-border-default">
    <p className="tw-m-0 tw-font-title-default tw-text-text-default">
      {isBase ? 'This page is new in the later version' : 'This page was removed'}
    </p>
    <span className="tw-font-body-small tw-text-text-placeholder">Not in {side.name}</span>
  </div>
);

const Stage = ({ mode, base, target, shared }) => {
  const stageRef = useRef(null);
  const [split, setSplit] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (mode !== 'swipe' || !stageRef.current) return;
    setSplit((value) => value ?? stageRef.current.clientWidth / 2);
  }, [mode]);

  const startDrag = (event) => {
    event.preventDefault();
    setDragging(true);
    const rect = stageRef.current.getBoundingClientRect();
    const move = (moveEvent) => setSplit(Math.max(24, Math.min(rect.width - 24, moveEvent.clientX - rect.left)));
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onHandleKey = (event) => {
    const width = stageRef.current.clientWidth;
    if (event.key === 'ArrowLeft') setSplit((value) => Math.max(24, value - width / 20));
    if (event.key === 'ArrowRight') setSplit((value) => Math.min(width - 24, value + width / 20));
  };

  if (mode === 'swipe') {
    return (
      <div className={cx('vd-swipe', { 'vd-swipe--dragging': dragging })} ref={stageRef}>
        <div className="vd-swipe__layer">
          {base.missing ? <Missing side={base} isBase /> : <SideFrame shared={shared} side={base} />}
        </div>
        <div className="vd-swipe__layer" style={{ clipPath: `inset(0 0 0 ${split ?? 0}px)` }}>
          {target.missing ? <Missing side={target} /> : <SideFrame shared={shared} side={target} />}
        </div>
        <FrameLabel side={base} floating="base" />
        <FrameLabel side={target} floating="target" />
        {split != null && (
          <div
            className="vd-swipe__handle"
            style={{ left: split }}
            role="slider"
            tabIndex={0}
            aria-label="Move the divider between the two versions"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((split / (stageRef.current?.clientWidth || 1)) * 100)}
            onPointerDown={startDrag}
            onKeyDown={onHandleKey}
          >
            <span className="vd-swipe__knob">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 4 2 8l4 4M10 4l4 4-4 4" />
              </svg>
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="vd-split">
      <section className="vd-pane">
        <FrameLabel side={base} />
        {base.missing ? <Missing side={base} isBase /> : <SideFrame shared={shared} side={base} />}
      </section>
      <section className="vd-pane">
        <FrameLabel side={target} />
        {target.missing ? <Missing side={target} /> : <SideFrame shared={shared} side={target} />}
      </section>
    </div>
  );
};

export default VersionDiffDialog;
