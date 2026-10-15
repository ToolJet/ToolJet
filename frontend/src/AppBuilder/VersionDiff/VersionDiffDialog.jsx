import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import {
  ArrowRight,
  ChevronDown,
  Columns2,
  GitCompareArrows,
  GitPullRequestArrow,
  Monitor,
  Smartphone,
  SquareSplitHorizontal,
  X,
} from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { appVersionService, authenticationService } from '@/_services';
import { useVersionDiffStore } from './useVersionDiffStore';
import { ChangeList, STATUS_WORD, typeLabel } from './ChangeList';
import { VersionFrame } from './VersionFrame';
import { ReviewPanel, RequestReviewForm, StatusPill } from './ReviewPanel';
import { reviewService } from './reviewService';
import './versionDiff.scss';

const STATUS_LABEL = { DRAFT: 'Draft', PUBLISHED: 'Saved' };

const VersionSelect = ({ label, value, versions, onChange, releasedVersionId, disabledId }) => {
  const version = versions.find((item) => item.id === value);
  const isReleased = version?.id === releasedVersionId;
  return (
    <label className="vd-picker">
      <span className="vd-picker__label">{label}</span>
      <span className="vd-picker__value">
        <span
          className={cx('vd-dot', {
            'vd-dot--released': isReleased,
            'vd-dot--saved': !isReleased && version?.status === 'PUBLISHED',
          })}
        />
        <span className="vd-picker__name">{version?.name ?? 'Choose a version'}</span>
        <span className="vd-picker__status">{isReleased ? 'Released' : STATUS_LABEL[version?.status] ?? ''}</span>
        <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {versions.map((item) => (
          <option key={item.id} value={item.id} disabled={item.id === disabledId}>
            {item.name}
            {item.id === releasedVersionId ? ' (released)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
};

const Segmented = ({ value, onChange, options, label }) => (
  <div className="vd-seg" role="radiogroup" aria-label={label}>
    {options.map(({ id, text, Icon }) => (
      <button
        key={id}
        type="button"
        role="radio"
        aria-checked={value === id}
        className={cx('vd-seg__opt', { 'vd-seg__opt--on': value === id })}
        onClick={() => onChange(id)}
        title={text}
      >
        <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
        <span>{text}</span>
      </button>
    ))}
  </div>
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
  ai: 'What the last AI edit changed',
  review: 'Review changes',
};

export const VersionDiffDialog = ({ darkMode }) => {
  const { moduleId } = useModuleContext();
  const { isOpen, baseVersionId, targetVersionId, source, reviewId, closeCompare } = useVersionDiffStore();
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
  const closeRef = useRef(null);
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
        setPair({ target: target?.id ?? null, base: baseVersionId ?? defaultBase(target, sorted, releasedVersionId) });
      })
      .catch((err) => !cancelled && setError(err?.error ?? 'Versions could not be loaded'));
    return () => {
      cancelled = true;
    };
  }, [isOpen, appId, baseVersionId, targetVersionId, reviewId, selectedVersion?.id, releasedVersionId]);

  useEffect(() => {
    if (!isOpen || !pair.base || !pair.target || pair.base === pair.target) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    appVersionService
      .getDiff(appId, pair.target, pair.base)
      .then((result) => {
        if (cancelled) return;
        setDiff(result);
        setSelectedKey(null);
        setFilter('all');
        setScroll(null);
        const firstPage = result.pages.find((page) => page.components.length) ?? result.pages[0];
        setPageKey(firstPage?.key ?? null);
      })
      .catch((err) => !cancelled && setError(err?.error ?? err?.message ?? 'The comparison could not be loaded'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, appId, pair.base, pair.target]);

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
        if (!cancelled) setReview(full);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, appId, pair.target]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) {
      setReview(null);
      setPanel(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event) => {
      if (event.key === 'Escape') closeCompare();
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeCompare]);

  const versionById = useMemo(() => new Map(versions.map((version) => [version.id, version])), [versions]);
  const page = diff?.pages.find((item) => item.key === pageKey) ?? null;

  const frameSrc = useCallback(
    (versionId) => {
      const version = versionById.get(versionId);
      if (!version || !pageKey) return null;
      const env = environments?.find((item) => item.id === version.currentEnvironmentId)?.name;
      const query = new URLSearchParams({ version: version.name, ...(env ? { env } : {}) });
      return `/applications/${slug || appId}/${pageKey}?${query.toString()}`;
    },
    [versionById, environments, slug, appId, pageKey]
  );

  const highlights = useMemo(() => {
    // A container whose only change is the order of its children would
    // otherwise paint the whole page amber. It gets a light dashed outline.
    const components = (page?.components ?? []).map((component) => ({
      ...component,
      weak:
        component.status === 'changed' &&
        component.events.length === 0 &&
        component.changes.every((change) => change.path === 'properties.childOrder' || change.group === 'layout') &&
        page.components.some((child) => child.parent.target === component.name || child.parent.base === component.name),
    }));
    return {
      base: components
        .filter((component) => component.status !== 'added')
        .map((component) => ({
          id: component.baseId,
          key: component.key,
          name: component.name,
          status: component.status,
          weak: component.weak,
        })),
      target: components
        .filter((component) => component.status !== 'removed')
        .map((component) => ({
          id: component.targetId,
          key: component.key,
          name: component.name,
          status: component.status,
          weak: component.weak,
        })),
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
    : SOURCE_COPY[source === 'review' ? 'header' : source] ?? SOURCE_COPY.header;

  const pickTarget = (id) => {
    const target = versionById.get(id);
    setPair((prev) => ({
      target: id,
      base: prev.base === id ? defaultBase(target, versions, releasedVersionId) : prev.base,
    }));
  };
  const swap = () => setPair((prev) => ({ base: prev.target, target: prev.base }));

  const hovered = hover && page?.components.find((component) => component.key === hover.key);
  const baseName = diff?.base.name ?? versionById.get(pair.base)?.name;
  const targetName = diff?.target.name ?? versionById.get(pair.target)?.name;

  const frames = page && (
    <Stage
      mode={mode}
      viewport={viewport}
      baseName={baseName}
      targetName={targetName}
      base={{
        src: page.status === 'added' ? null : frameSrc(pair.base),
        highlights: highlights.base,
        onFound: onFoundBase,
      }}
      target={{
        src: page.status === 'removed' ? null : frameSrc(pair.target),
        highlights: highlights.target,
        onFound: onFoundTarget,
      }}
      shared={{
        viewport,
        selectedKey,
        hoveredKey: hover?.key ?? null,
        onSelect: (key) => setSelectedKey(key),
        onHover,
        syncScroll: scroll,
        onScrollChange: setScroll,
      }}
    />
  );

  return createPortal(
    <div
      className={cx('vd-root', { 'dark-theme theme-dark': darkMode })}
      role="dialog"
      aria-modal="true"
      aria-label="Compare versions"
    >
      <header className="vd-head">
        <div className="vd-head__title">
          <GitCompareArrows size={18} strokeWidth={1.75} aria-hidden="true" />
          <h2>{title}</h2>
        </div>
        <div className="vd-head__pair">
          <VersionSelect
            label="From"
            value={pair.base}
            versions={versions}
            onChange={(id) => setPair((prev) => ({ ...prev, base: id }))}
            releasedVersionId={releasedVersionId}
            disabledId={pair.target}
          />
          <button type="button" className="vd-swap" onClick={swap} aria-label="Swap the two versions" title="Swap">
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <VersionSelect
            label="To"
            value={pair.target}
            versions={versions}
            onChange={pickTarget}
            releasedVersionId={releasedVersionId}
            disabledId={pair.base}
          />
        </div>
        <div className="vd-head__tools">
          {review ? (
            <button
              type="button"
              className={cx('vd-review-toggle', { 'vd-review-toggle--on': panel === 'review' })}
              onClick={() => setPanel(panel === 'review' ? null : 'review')}
              aria-pressed={panel === 'review'}
            >
              <GitPullRequestArrow size={14} strokeWidth={1.75} aria-hidden="true" />
              <span>Review</span>
              <StatusPill status={review.state.status} />
            </button>
          ) : (
            pair.target &&
            pair.base && (
              <button type="button" className="vd-review-toggle" onClick={() => setPanel('create')}>
                <GitPullRequestArrow size={14} strokeWidth={1.75} aria-hidden="true" />
                <span>Request review</span>
              </button>
            )
          )}
          <Segmented
            label="Screen size"
            value={viewport}
            onChange={setViewport}
            options={[
              { id: 'desktop', text: 'Desktop', Icon: Monitor },
              { id: 'mobile', text: 'Mobile', Icon: Smartphone },
            ]}
          />
          <Segmented
            label="Layout"
            value={mode}
            onChange={setMode}
            options={[
              { id: 'split', text: 'Side by side', Icon: Columns2 },
              { id: 'swipe', text: 'Swipe', Icon: SquareSplitHorizontal },
            ]}
          />
          <button ref={closeRef} type="button" className="vd-close" onClick={closeCompare} aria-label="Close compare">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div className={cx('vd-body', { 'vd-body--panel': showPanel })}>
        {error && <div className="vd-state vd-state--error">{String(error)}</div>}
        {!error && (loading || !diff) && (
          <div className="vd-state">
            Comparing {baseName ?? '…'} with {targetName ?? '…'}
          </div>
        )}
        {!error && !loading && diff && (
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
            <main className="vd-stage-wrap">
              {diff.identical ? (
                <div className="vd-state vd-state--calm">
                  <p className="vd-state__big">No differences</p>
                  <p>
                    {targetName} has the same pages, components, queries and settings as {baseName}.
                  </p>
                </div>
              ) : page ? (
                frames
              ) : (
                <div className="vd-state vd-state--calm">
                  <p className="vd-state__big">No page changes</p>
                  <p>The differences are in queries or app settings. They are listed on the left.</p>
                </div>
              )}
            </main>
            {panel === 'review' && review && (
              <ReviewPanel
                appId={appId}
                review={review}
                currentUser={currentUser}
                anchor={selectedComponent ? { key: selectedComponent.key, name: selectedComponent.name } : null}
                onClearAnchor={() => setSelectedKey(null)}
                onAnchor={goToAnchor}
                onChange={setReview}
                onClose={() => setPanel(null)}
              />
            )}
            {panel === 'create' && !review && (
              <RequestReviewForm
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
          className="vd-card"
          style={{
            left: Math.min(hover.x + 16, window.innerWidth - 336),
            top: Math.min(hover.y + 16, window.innerHeight - 200),
          }}
          role="tooltip"
        >
          <div className="vd-card__head">
            <span className={cx('vd-tag', `vd-tag--${hovered.status}`)}>{STATUS_WORD[hovered.status]}</span>
            <span className="vd-card__name">{hovered.name}</span>
            <span className="vd-card__type">{typeLabel(hovered.type)}</span>
          </div>
          {hovered.status === 'changed' ? (
            <ul className="vd-card__lines">
              {[...hovered.changes.map((change) => change.summary), ...hovered.events.map((event) => event.summary)]
                .slice(0, 5)
                .map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              {hovered.changes.length + hovered.events.length > 5 && (
                <li className="vd-card__more">{hovered.changes.length + hovered.events.length - 5} more in the list</li>
              )}
            </ul>
          ) : (
            <p className="vd-card__note">
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

const FrameLabel = ({ side, name }) => (
  <div className={cx('vd-label', `vd-label--${side}`)}>
    <span className="vd-label__name">{name}</span>
    <span className="vd-label__side">{side === 'base' ? 'before' : 'after'}</span>
  </div>
);

const Missing = ({ name, side }) => (
  <div className="vd-missing">
    <p>{side === 'base' ? `This page is new in the later version` : `This page was removed`}</p>
    <span>Not in {name}</span>
  </div>
);

const Stage = ({ mode, baseName, targetName, base, target, shared }) => {
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
          {base.src ? <VersionFrame {...shared} {...base} /> : <Missing name={baseName} side="base" />}
        </div>
        <div className="vd-swipe__layer" style={{ clipPath: `inset(0 0 0 ${split ?? 0}px)` }}>
          {target.src ? <VersionFrame {...shared} {...target} /> : <Missing name={targetName} side="target" />}
        </div>
        <FrameLabel side="base" name={baseName} />
        <FrameLabel side="target" name={targetName} />
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
        <FrameLabel side="base" name={baseName} />
        {base.src ? <VersionFrame {...shared} {...base} /> : <Missing name={baseName} side="base" />}
      </section>
      <section className="vd-pane">
        <FrameLabel side="target" name={targetName} />
        {target.src ? <VersionFrame {...shared} {...target} /> : <Missing name={targetName} side="target" />}
      </section>
    </div>
  );
};

export default VersionDiffDialog;
