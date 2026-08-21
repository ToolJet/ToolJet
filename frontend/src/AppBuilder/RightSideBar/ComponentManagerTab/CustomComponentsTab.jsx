import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { noop } from 'lodash';
import { useGridStore } from '@/_stores/gridStore';
import { useCanvasDropHandler } from '@/AppBuilder/AppCanvas/Hooks/useCanvasDropHandler';
import { customComponentLibrariesService } from '@/_services/customComponentLibraries.service';
import { useCustomComponentPreviewStore } from '@/_stores/customComponentPreviewStore';
import { normalizePin, pinKey, libraryFileUrl } from '@/AppBuilder/Widgets/libraryComponentRevision';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { Container } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/Rocket/shadcn/dropdown-menu';

const initials = (name = '') => (name.match(/[A-Z]/g) || []).slice(0, 2).join('') || name.slice(0, 2).toUpperCase();

// Single source of truth for "what revision is this library showing" — shared by the
// palette (LibrarySection) and the dropdown (VersionPicker) so they can't disagree.
// `current` is for DISPLAY (may be `dev:{userId}`); `pinRevision` is for a fresh drop's
// auto-pin and must never be the dev preview — pinning it would write the session-local
// preview into globalSettings and violate invariant #14 (dev preview must never persist).
const useLibraryCurrentRevision = (library) => {
  const pins = useStore((state) => state.globalSettings?.customComponentLibraries);
  const devPreview = useCustomComponentPreviewStore((state) => state.devPreviews?.[library.id]);
  const latest = library.revisions[0]?.version;
  const pin = normalizePin(pins?.[pinKey(library.id)] ?? pins?.[library.id]);
  const pinRevision = pin ?? latest;
  return { current: devPreview ?? pinRevision, pin, latest, devPreview, pinRevision };
};

// Fetches manifest.json for whatever revision the palette should currently display,
// via the same per-revision/per-dev-bundle serve routes the widget runtime already
// uses (libraryFileUrl) — no separate manifest API needed. Falls back to the B9 list's
// latest-revision manifest (already in hand) so the common case needs no network call.
const useResolvedManifest = (library, current, latest) => {
  const cacheRef = useRef({});

  const devNonce = useCustomComponentPreviewStore((state) =>
    current?.startsWith?.('dev:') ? state.devBundleUpdatedAt?.[library.id] : undefined
  );

  const [manifest, setManifest] = useState(current === latest ? library.manifest : null);

  const cacheKey = devNonce ? `${current}@${devNonce}` : current;

  useEffect(() => {
    if (current === latest) {
      setManifest(library.manifest);
      return;
    }

    if (cacheRef.current[cacheKey]) {
      setManifest(cacheRef.current[cacheKey]);
      return;
    }

    let cancelled = false;

    fetch(libraryFileUrl(library.id, current, 'manifest.json'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          cacheRef.current[cacheKey] = data;
          setManifest(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [library.id, library.manifest, current, latest, cacheKey]);

  return manifest;
};

const CustomComponentCard = ({ libraryId, revisionId, name, displayName, description, props }) => {
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const [isRightSidebarOpen, toggleRightSidebar] = useStore(
    (state) => [state.isRightSidebarOpen, state.toggleRightSidebar],
    shallow
  );
  const { handleDrop } = useCanvasDropHandler() || noop;

  const dragComponent = useMemo(
    () => ({
      component: 'LibraryComponent',
      displayName: name,
      defaultSize: { width: 12, height: 200 },
      libraryComponentInfo: { libraryId, componentName: name, revisionId, props },
    }),
    [libraryId, name, revisionId, props]
  );

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'box',
      item: { componentType: 'LibraryComponent', component: dragComponent },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      end: (item) => {
        const currentDragCanvasId = useGridStore.getState().currentDragCanvasId;
        handleDrop(item, currentDragCanvasId);
        const { globalSettings, globalSettingsChanged } = useStore.getState();
        const pins = globalSettings?.customComponentLibraries ?? {};
        if (!normalizePin(pins[pinKey(libraryId)] ?? pins[libraryId])) {
          globalSettingsChanged({ customComponentLibraries: { ...pins, [pinKey(libraryId)]: revisionId } });
        }
      },
    }),
    [dragComponent]
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, []);

  useEffect(() => {
    if (isDragging && !isRightSidebarPinned) {
      toggleRightSidebar(!isRightSidebarOpen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return (
    <div ref={drag} className="custom-component-card" data-cy={`custom-component-${name.toLowerCase()}`}>
      <div className="custom-component-card-icon">{initials(displayName ?? name)}</div>
      <div className="custom-component-card-text">
        <div className="custom-component-card-name">{displayName ?? name}</div>
        {description && <div className="custom-component-card-description">{description}</div>}
      </div>
    </div>
  );
};

const VersionPicker = ({ library }) => {
  const pins = useStore((state) => state.globalSettings?.customComponentLibraries);
  const globalSettingsChanged = useStore((state) => state.globalSettingsChanged);
  const setDevPreview = useCustomComponentPreviewStore((state) => state.setDevPreview);
  const clearDevPreview = useCustomComponentPreviewStore((state) => state.clearDevPreview);

  const { current, pin, latest, devPreview } = useLibraryCurrentRevision(library);
  const hasUpdate = Boolean(pin && pin !== latest);

  const normalizedPins = () =>
    Object.fromEntries(Object.entries(pins ?? {}).map(([libId, value]) => [pinKey(libId), normalizePin(value)]));

  const selectRevision = (version) => {
    clearDevPreview(library.id);
    globalSettingsChanged({
      customComponentLibraries: { ...normalizedPins(), [pinKey(library.id)]: version },
    });
  };

  const selectDevPreview = (userId, userEmail) => {
    setDevPreview(library.id, `dev:${userId}`, userEmail);
  };

  return (
    <div className="custom-library-version-picker" onClick={(e) => e.stopPropagation()}>
      {hasUpdate && (
        <TablerIcon
          iconName="IconRefresh"
          title="New revision available"
          style={{ width: 16, height: 16, color: 'var(--primary-accent-strong)' }}
          stroke={1.5}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="custom-library-version-chip"
            data-cy={`custom-library-version-${library.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {devPreview ? 'dev' : current}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="custom-library-version-menu" onClick={(e) => e.stopPropagation()}>
          {library.revisions.map(({ id, version, createdAt }) => (
            <DropdownMenuItem key={id} className="version-menu-row" onSelect={() => selectRevision(version)}>
              {/* row = space-between: [check + title/subtitle] group left, New badge right */}
              <span className="version-menu-main">
                <span className="version-menu-check">
                  {version === current && (
                    <TablerIcon
                      iconName="IconCheck"
                      color="var(--primary-accent-strong)"
                      style={{ width: 24, height: 24 }}
                      stroke={1.5}
                    />
                  )}
                </span>
                <span className="version-menu-text">
                  <span className="version-menu-title">{version}</span>
                  <span className="version-menu-subtitle">
                    {moment(createdAt).format('MMM D')}
                    {version === pin ? ' · current' : version === latest ? ' · latest' : ''}
                  </span>
                </span>
              </span>
              {version === latest && hasUpdate && <span className="version-menu-new-badge">New</span>}
            </DropdownMenuItem>
          ))}
          {library?.devBundles?.length > 0 && <DropdownMenuSeparator className="version-menu-divider" />}
          {library?.devBundles?.map(({ userId, userEmail }) => (
            <DropdownMenuItem
              key={userId}
              className="version-menu-row"
              onSelect={() => selectDevPreview(userId, userEmail)}
            >
              <span className="version-menu-main">
                <span className="version-menu-check">
                  {devPreview === `dev:${userId}` && (
                    <TablerIcon
                      iconName="IconCheck"
                      color="var(--primary-accent-strong)"
                      style={{ width: 24, height: 24 }}
                      stroke={1.5}
                    />
                  )}
                </span>
                <span className="version-menu-text">
                  <span className="version-menu-title">
                    Dev preview
                    <span className="version-menu-live-dot" />
                  </span>
                  <span className="version-menu-subtitle">@{userEmail ?? userId} · preview only</span>
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const LibrarySection = ({ library, searchQuery = '' }) => {
  const [open, setOpen] = useState(true);
  const { current, latest, pinRevision } = useLibraryCurrentRevision(library);
  const manifest = useResolvedManifest(library, current, latest);
  // manifest.components: Record<exportName, { displayName?, description?, defaultWidth?, defaultHeight? }>
  // Filtered here (against whatever revision is actually displayed) rather than upstream,
  // so switching revisions/dev preview while a search is active stays consistent with the query.
  const q = searchQuery.trim().toLowerCase();
  const matchesLibraryName = library.name.toLowerCase().includes(q);
  const components = Object.entries(manifest?.components ?? {}).filter(
    ([exportName]) => !q || matchesLibraryName || exportName.toLowerCase().includes(q)
  );

  if (!components.length) return null; // library with no published revision yet, or the selected revision is still loading

  return (
    <div className="custom-library-section">
      <div
        className="custom-library-section-header"
        onClick={() => setOpen((prev) => !prev)}
        data-cy={`custom-library-${library.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span className="custom-library-section-title">{library.name}</span>
        <div className="custom-library-section-meta">
          <VersionPicker library={library} />
          <TablerIcon
            iconName={open ? 'IconChevronUp' : 'IconChevronDown'}
            style={{ width: 16, height: 16, color: 'var(--text-placeholder)' }}
            stroke={1.5}
          />
        </div>
      </div>

      {open && (
        <div className="custom-library-section-content">
          {components.map(([exportName, comp]) => (
            <CustomComponentCard
              key={exportName}
              libraryId={library.id}
              revisionId={pinRevision}
              name={exportName} // the bundle's export — what the shell resolves
              displayName={comp.displayName}
              description={comp.description}
              props={comp.props ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CustomComponentsTab = ({ searchQuery = '' }) => {
  const [libraries, setLibraries] = useState(null); // null = loading

  useEffect(() => {
    customComponentLibrariesService
      .list()
      .then(setLibraries)
      .catch(() => setLibraries([]));
  }, []);

  const filtered = useMemo(() => {
    if (!libraries) return null;
    const withRevisions = libraries.filter((lib) => lib.revisions.length > 0);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return withRevisions;
    // match on library name OR component name — component-name matching is against the
    // latest-revision manifest (the only one we have without a fetch); a matching library
    // keeps everything regardless. LibrarySection re-applies this same query against
    // whichever revision it actually ends up displaying (see its own filtering).
    return withRevisions.filter((lib) => {
      if (lib.name.toLowerCase().includes(q)) return true;
      return Object.keys(lib.manifest?.components ?? {}).some((name) => name.toLowerCase().includes(q));
    });
  }, [libraries, searchQuery]);

  if (filtered === null) return null; // loading — the panel shows nothing briefly

  if (filtered.length === 0) {
    return (
      <div className="custom-components-empty">
        <Container size={24} color="var(--text-placeholder)" strokeWidth={1.5} />
        <p className="custom-components-empty-title">{searchQuery ? 'No results found' : 'No custom libraries yet'}</p>
        <p className="custom-components-empty-subtitle">
          {searchQuery
            ? 'Try adjusting your search to find what you are looking for.'
            : 'Ask your admin or developer to deploy one using the ToolJet CLI.'}
        </p>
      </div>
    );
  }

  return (
    <div className="custom-components-tab">
      {filtered.map((library) => (
        <LibrarySection key={library.id} library={library} searchQuery={searchQuery} />
      ))}
    </div>
  );
};
