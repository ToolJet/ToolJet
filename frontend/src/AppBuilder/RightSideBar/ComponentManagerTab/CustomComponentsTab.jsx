import React, { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { noop } from 'lodash';
import { useGridStore } from '@/_stores/gridStore';
import { useCanvasDropHandler } from '@/AppBuilder/AppCanvas/Hooks/useCanvasDropHandler';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { normalizePin, dashlessId } from '@/AppBuilder/Widgets/libraryComponentRevision';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { Container } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/Rocket/shadcn/dropdown-menu';
import { useLibraryCurrentRevision } from './hooks/useLibraryCurrentRevision';
import { useResolvedManifest } from './hooks/useResolvedManifest';
import { initials, hasLibraryContent, getLibrarySearchMatch, normalizedPinsMap, withId } from './utils';

export const CustomComponentsTab = ({ searchQuery = '' }) => {
  const libraries = useCustomComponentLibrariesStore((state) => state.libraries); // null = loading
  // libraryId -> visible, as reported by each mounted LibrarySection (see its isVisible).
  const [visibleIds, setVisibleIds] = useState(() => new Set());

  useEffect(() => {
    useCustomComponentLibrariesStore.getState().fetchLibraries();
  }, []);

  // No query filtering here: a match depends on whichever revision is actually
  // pinned/displayed, which only LibrarySection can resolve (it may need to fetch that
  // revision's manifest first). This just keeps libraries worth showing at all — a
  // dev-only library with nothing picked yet still gets a header + VersionPicker.
  const candidates = useMemo(() => (libraries ? libraries.filter(hasLibraryContent) : null), [libraries]);

  // Every update here goes through withId, never a blind overwrite — LibrarySection
  // reports its own id in/out (see its cleanup) on every mount/query change/unmount, so
  // this map always converges to the correct set with no reset effect needed. A reset
  // effect here would race the children's own report effects within the same commit
  // (parent effects run after child effects) and can clobber a just-reported match.
  const reportVisibility = useCallback((libraryId, visible) => {
    setVisibleIds((prev) => withId(prev, libraryId, visible));
  }, []);

  if (candidates === null) return null; // loading — the panel shows nothing briefly

  if (candidates.length === 0) {
    return <NoResultsMessage searchQuery={searchQuery} />;
  }

  // Sections stay mounted (each self-hides) even while nothing has matched yet, so an
  // older-pinned library's manifest fetch can still resolve and clear this message —
  // returning early here instead would prevent LibrarySection from ever reporting back.
  const showNoResults = searchQuery.trim() && visibleIds.size === 0;

  return (
    <div className="custom-components-tab">
      {showNoResults && <NoResultsMessage searchQuery={searchQuery} />}
      {candidates.map((library) => (
        <LibrarySection
          key={library.id}
          library={library}
          searchQuery={searchQuery}
          onVisibilityChange={reportVisibility}
        />
      ))}
    </div>
  );
};

const NoResultsMessage = ({ searchQuery }) => (
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

const LibrarySection = ({ library, searchQuery = '', onVisibilityChange = noop }) => {
  const [open, setOpen] = useState(true);
  const { current, latest } = useLibraryCurrentRevision(library);
  const manifest = useResolvedManifest(library, current, latest);
  const { components, isVisible } = getLibrarySearchMatch(library, manifest?.components, searchQuery);

  // Cleanup reports "gone" on unmount (library removed from the candidate list) or
  // right before re-reporting on a query/manifest change — always a targeted add/remove
  // via withId, never a wholesale reset, so it can't race or clobber a sibling's report.
  useEffect(() => {
    onVisibilityChange(library.id, isVisible);
    return () => onVisibilityChange(library.id, false);
  }, [library.id, isVisible, onVisibilityChange]);

  // A dev-only library with nothing picked yet still renders its header + VersionPicker
  // so it's discoverable — the card list itself stays empty until a dev entry is chosen.
  if (!isVisible) return null;

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
              correlationId={library.correlationId}
              libraryName={library.name}
              revisionId={current}
              name={exportName} // the bundle's export — what the shell resolves
              componentConfig={comp}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const VersionPicker = ({ library }) => {
  const pins = useStore((state) => state.globalSettings?.customComponentLibraries);
  const globalSettingsChanged = useStore((state) => state.globalSettingsChanged);

  const { current, pin, latest } = useLibraryCurrentRevision(library);
  const isDevPin = Boolean(current?.startsWith?.('dev:'));
  const hasUpdate = Boolean(pin && pin !== latest);

  const pinFor = (version) => ({
    customComponentLibraries: { ...normalizedPinsMap(pins), [dashlessId(library.correlationId)]: version },
  });

  const selectRevision = (version) => globalSettingsChanged(pinFor(version));

  // Selecting a dev bundle pins it immediately, same as a revision — no separate
  // private-preview step (see invariant #14, HANDOFF-NISHIDH.md).
  const selectDevPreview = (userId) => globalSettingsChanged(pinFor(`dev:${userId}`));

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
            {isDevPin ? 'dev' : current ?? 'Select version'}
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
            <DropdownMenuItem key={userId} className="version-menu-row" onSelect={() => selectDevPreview(userId)}>
              <span className="version-menu-main">
                <span className="version-menu-check">
                  {current === `dev:${userId}` && (
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
                  <span className="version-menu-subtitle">
                    @{userEmail ?? userId}
                    {current === `dev:${userId}` ? ' · current' : ''}
                  </span>
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const CustomComponentCard = ({ libraryId, correlationId, libraryName, revisionId, name, componentConfig }) => {
  const { displayName, description, props = [], defaultWidth, defaultHeight } = componentConfig;
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
      defaultSize: { width: defaultWidth ?? 12, height: defaultHeight ?? 200 },
      libraryComponentInfo: {
        libraryId,
        correlationId,
        libraryName,
        componentName: name,
        revisionId,
        props,
        defaultSize: { width: defaultWidth ?? 12, height: defaultHeight ?? 200 },
      },
    }),
    [libraryId, correlationId, libraryName, name, revisionId, props, defaultWidth, defaultHeight]
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
        if (!normalizePin(pins[dashlessId(correlationId)] ?? pins[correlationId])) {
          globalSettingsChanged({ customComponentLibraries: { ...pins, [dashlessId(correlationId)]: revisionId } });
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
