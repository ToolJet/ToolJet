import React, { useEffect, useMemo, useState } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { noop } from 'lodash';
import { useGridStore } from '@/_stores/gridStore';
import { useCanvasDropHandler } from '@/AppBuilder/AppCanvas/Hooks/useCanvasDropHandler';
import { customComponentLibrariesService } from '@/_services/customComponentLibraries.service';
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
          {latestVersion && <span className="custom-library-version-chip">{latestVersion}</span>}
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
