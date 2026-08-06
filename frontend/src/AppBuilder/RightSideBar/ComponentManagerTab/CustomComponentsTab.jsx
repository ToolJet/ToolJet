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
import { normalizePin } from '@/AppBuilder/Widgets/libraryComponentRevision';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import SolidIcon from '@/_ui/Icon/SolidIcons';

// F4a: the widget panel's "Custom" tab (design 38-4040) — lists deployed custom
// component libraries; each component is draggable and drops a LibraryComponent
// instance pre-filled via libraryComponentInfo (see useCanvasDropHandler).

// "CurrencyInput" → "CI", "Heatmap" → "HE" (capitals first, first-two fallback)
const initials = (name = '') => (name.match(/[A-Z]/g) || []).slice(0, 2).join('') || name.slice(0, 2).toUpperCase();

const CustomComponentCard = ({ libraryId, revisionId, name, displayName, description, props }) => {
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const [isRightSidebarOpen, toggleRightSidebar] = useStore(
    (state) => [state.isRightSidebarOpen, state.toggleRightSidebar],
    shallow
  );
  const { handleDrop } = useCanvasDropHandler() || noop;

  // The drag item mirrors DragLayer's shape; libraryComponentInfo is the payload
  // addNewWidgetToTheEditor stamps into the new instance's properties.
  const dragComponent = useMemo(
    () => ({
      component: 'LibraryComponent',
      displayName: name,
      // The canvas drag-ghost sizes itself from component.defaultSize (Container.jsx).
      // NOTE: manifest defaultWidth/Height are NOT consumed yet — their units are
      // undefined until C2 is agreed with the CLI (hello-world ships 6×5, which as px
      // meant a 5px-tall widget). `defaultSize` prop resumes flowing once C2 lands.
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
        // F5: first drop of a library into this app sets the app-level pin to the
        // latest revision (all future instances of this library follow the pin).
        const { globalSettings, globalSettingsChanged } = useStore.getState();
        const pins = globalSettings?.customComponentLibraries ?? {};
        if (!normalizePin(pins[libraryId])) {
          globalSettingsChanged({ customComponentLibraries: { ...pins, [libraryId]: revisionId } });
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

// F5: the version picker on the library header (design 38-4040 frames 02/03).
// Picking a REVISION writes the app-level pin (globalSettings.customComponentLibraries)
// — every instance of the library in this app moves together (LLD §5.7), autosaved.
// Picking a DEV bundle sets a session-local preview override — never persisted.
const VersionPicker = ({ library }) => {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  const pins = useStore((state) => state.globalSettings?.customComponentLibraries);
  const globalSettingsChanged = useStore((state) => state.globalSettingsChanged);
  const devPreview = useCustomComponentPreviewStore((state) => state.devPreviews?.[library.id]);
  const setDevPreview = useCustomComponentPreviewStore((state) => state.setDevPreview);
  const clearDevPreview = useCustomComponentPreviewStore((state) => state.clearDevPreview);

  const latest = library.revisions[0]?.version;
  const pin = normalizePin(pins?.[library.id]);
  const current = devPreview ?? pin ?? latest;
  const hasUpdate = Boolean(pin && pin !== latest);

  // Always write FLAT-STRING pins and normalize any legacy object rows along the
  // way (see libraryComponentRevision.js — deep decamelize mangles nested keys).
  const normalizedPins = () =>
    Object.fromEntries(Object.entries(pins ?? {}).map(([libId, value]) => [libId, normalizePin(value)]));

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (!pickerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const selectRevision = (version) => {
    clearDevPreview(library.id);
    globalSettingsChanged({
      customComponentLibraries: { ...normalizedPins(), [library.id]: version },
    });
    setOpen(false);
  };

  const selectDevPreview = (userId) => {
    setDevPreview(library.id, `dev:${userId}`);
    setOpen(false);
  };

  return (
    <div className="custom-library-version-picker" ref={pickerRef} onClick={(e) => e.stopPropagation()}>
      {hasUpdate && (
        <TablerIcon
          iconName="IconRefresh"
          title="New revision available"
          style={{ width: 16, height: 16, color: 'var(--text-placeholder)' }}
          stroke={1.5}
        />
      )}
      <button
        type="button"
        className="custom-library-version-chip"
        onClick={() => setOpen((prev) => !prev)}
        data-cy={`custom-library-version-${library.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {devPreview ? 'dev' : current}
      </button>
      {open && (
        <div className="custom-library-version-menu">
          {library.revisions.map(({ id, version, createdAt }) => (
            <div key={id} className="version-menu-row" onClick={() => selectRevision(version)}>
              <span className="version-menu-check">
                {version === current && (
                  <TablerIcon iconName="IconCheck" style={{ width: 16, height: 16 }} stroke={1.5} />
                )}
              </span>
              <span className="version-menu-text">
                <span className="version-menu-title">
                  {version}
                  {version === latest && hasUpdate && <span className="version-menu-new-badge">New</span>}
                </span>
                <span className="version-menu-subtitle">
                  {moment(createdAt).format('MMM D')}
                  {version === pin ? ' · current' : version === latest ? ' · latest' : ''}
                </span>
              </span>
            </div>
          ))}
          {library.devBundles.length > 0 && <div className="version-menu-divider" />}
          {library.devBundles.map(({ userId, userEmail }) => (
            <div key={userId} className="version-menu-row" onClick={() => selectDevPreview(userId)}>
              <span className="version-menu-check">
                {devPreview === `dev:${userId}` && (
                  <TablerIcon iconName="IconCheck" style={{ width: 16, height: 16 }} stroke={1.5} />
                )}
              </span>
              <span className="version-menu-text">
                <span className="version-menu-title">
                  Dev preview
                  <span className="version-menu-live-dot" />
                </span>
                <span className="version-menu-subtitle">@{userEmail ?? userId} · preview only</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LibrarySection = ({ library }) => {
  const [open, setOpen] = useState(true);
  const latestVersion = library.revisions[0]?.version;
  // manifest.components: Record<exportName, { displayName?, description?, defaultWidth?, defaultHeight? }>
  const components = Object.entries(library.manifest?.components ?? {});

  if (!components.length) return null; // library with no published revision yet

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
              revisionId={latestVersion}
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
    // match on library name OR component name — a matching library keeps all its
    // components, otherwise only the matching components are kept.
    return withRevisions
      .map((lib) => {
        if (lib.name.toLowerCase().includes(q)) return lib;
        const components = Object.fromEntries(
          Object.entries(lib.manifest?.components ?? {}).filter(([name]) => name.toLowerCase().includes(q))
        );
        return { ...lib, manifest: { ...lib.manifest, components } };
      })
      .filter((lib) => Object.keys(lib.manifest?.components ?? {}).length > 0);
  }, [libraries, searchQuery]);

  if (filtered === null) return null; // loading — the panel shows nothing briefly

  if (filtered.length === 0) {
    return (
      <div className="custom-components-empty">
        <SolidIcon name="apps" width="24" fill="var(--text-placeholder)" />
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
        <LibrarySection key={library.id} library={library} />
      ))}
    </div>
  );
};
