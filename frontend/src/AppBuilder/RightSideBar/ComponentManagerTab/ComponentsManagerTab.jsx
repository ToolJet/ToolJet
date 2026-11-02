import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { isEmpty, debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { LEGACY_ITEMS, IGNORED_ITEMS } from './constants';
import { componentTypes, componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import Fuse from 'fuse.js';
import { SearchBox } from '@/_components';
import { DragLayer } from './DragLayer';
import { LibrarySection } from './CustomComponentsTab';
import { PackSection, useBuiltinPacks } from './BuiltinPackSections';
import { LibraryPicker } from './LibraryPicker';
import { ROCKET_1, libraryChoices, resolveLibraryChoice } from './componentLibrary';
import { hasLibraryContent } from './utils';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import useStore from '@/AppBuilder/_stores/store';
import Accordion from '@/_ui/Accordion';
import sectionConfig from './sectionConfig';

import { Button } from '@/components/ui/Button/Button';
import { ModuleManager } from '@/modules/Modules/components';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { useLicenseStore } from '@/_stores/licenseStore';
import { shallow } from 'zustand/shallow';
import Tabs from '@/ToolJetUI/Tabs/Tabs';
import Tab from '@/ToolJetUI/Tabs/Tab';
import './styles.scss';

// Simple error boundary component for module errors
class ModuleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Module error:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // Let parent handle the fallback
    }
    return this.props.children;
  }
}

// TODO: Hardcode all the component-section mapping in a constant file and just loop over it
// TODO: styling
// TODO: scrolling
// TODO: searching

export const ComponentsManagerTab = ({ darkMode, isModuleEditor }) => {
  const _shouldFreeze = useStore((state) => state.getShouldFreeze());
  const isAutoMobileLayout = useStore((state) => state.currentLayout === 'mobile' && state.getIsAutoMobileLayout());
  const shouldFreeze = _shouldFreeze || isAutoMobileLayout;
  const edition = fetchEdition();

  const { hasModuleAccess } = useLicenseStore(
    (state) => ({
      hasModuleAccess: state.hasModuleAccess,
    }),
    shallow
  );

  const hasCustomComponentLibrariesAccess = useStore(
    (state) => state.license?.featureAccess?.customComponentLibraries === true
  );

  // The app's component library (componentLibrary.js): ToolJet UI 1.0, a pack that ships with ToolJet (every
  // edition), or a custom library the plan allows.
  const builtinPacks = useBuiltinPacks();
  const libraries = useCustomComponentLibrariesStore((state) => state.libraries);
  useEffect(() => {
    if (hasCustomComponentLibrariesAccess) useCustomComponentLibrariesStore.getState().fetchLibraries();
  }, [hasCustomComponentLibrariesAccess]);
  const choices = useMemo(
    () =>
      libraryChoices(
        builtinPacks,
        hasCustomComponentLibrariesAccess ? (libraries ?? []).filter(hasLibraryContent) : []
      ),
    [builtinPacks, libraries, hasCustomComponentLibrariesAccess]
  );
  const hasLibraryChoices = choices.packs.length + choices.custom.length > 0;
  const savedLibrary = useStore((state) => state.globalSettings?.componentLibrary);
  const library = hasLibraryChoices
    ? resolveLibraryChoice(savedLibrary, choices, useStore.getState().getCurrentPageComponents?.() ?? {})
    : ROCKET_1;
  const libraryChoice = [...choices.packs, ...choices.custom].find((choice) => choice.value === library);
  const pickLibrary = (value) => {
    // A frozen editor only changes the list; it saves nothing.
    if (value !== savedLibrary && !shouldFreeze) useStore.getState().globalSettingsChanged({ componentLibrary: value });
  };

  const componentList = useMemo(() => {
    return [
      ...componentTypes
        .map((component) => component.component)
        .filter((component) => !IGNORED_ITEMS.includes(component)),
    ];
  }, [componentTypes]);

  const searchList = useMemo(() => {
    return [
      ...componentTypes
        .filter((component) => !IGNORED_ITEMS.includes(component.component))
        .map((component) => {
          return { component: component.component, displayName: component.displayName };
        }),
    ];
  }, [componentTypes]);

  const [filteredComponents, setFilteredComponents] = useState(componentList);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleError, setModuleError] = useState(false);
  const [activeTab, setActiveTab] = useState('components');

  // Force re-render when hasModuleAccess changes
  useEffect(() => {
    // If modules access is denied, nothing to do here now
  }, [hasModuleAccess]);

  useEffect(() => {
    setSearchQuery('');
    filterComponents('');
  }, [activeTab]);

  useEffect(() => {
    if (!searchQuery) setFilteredComponents(componentList);
  }, [componentList, searchQuery]);

  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);

  const filterComponentsRef = useRef(null);

  const handleSearchQueryChange = useMemo(
    () =>
      debounce((value) => {
        setSearchQuery(value);
        filterComponentsRef.current?.(value);
      }, 125),
    []
  );

  const handleToggle = () => {
    setActiveRightSideBarTab(null);
    setRightSidebarOpen(false);
  };

  const filterComponents = useCallback(
    (value) => {
      if (value !== '') {
        const fuse = new Fuse(searchList, {
          keys: ['displayName'],
          shouldSort: true,
          threshold: 0.4,
        });
        const results = fuse.search(value);

        // Preserve previous behavior: swap ToggleSwitchLegacy and ToggleSwitch indices
        // on a COPY (the original code mutated the memoized componentList in place).
        const list = [...componentList];
        const legacyIndex = list.findIndex((component) => component === 'ToggleSwitchLegacy');
        const toggleIndex = list.findIndex((component) => component === 'ToggleSwitch');
        if (legacyIndex !== -1 && toggleIndex !== -1) {
          [list[legacyIndex], list[toggleIndex]] = [list[toggleIndex], list[legacyIndex]];
        }
        setFilteredComponents(results.map((result) => result.item.component));
      } else {
        setFilteredComponents(componentList);
      }
    },
    [componentList, searchList]
  );

  filterComponentsRef.current = filterComponents;

  const { t } = useTranslation();

  function renderComponentCard(component, index) {
    return (
      <div key={component} className="text-center align-items-center clearfix draggable-box-wrapper">
        <DragLayer index={index} component={componentTypeDefinitionMap[component]} />
      </div>
    );
  }

  function renderList(items) {
    if (isEmpty(items)) return null;
    return (
      <div className="component-card-group-container">
        <div className="component-card-group-wrapper">
          {items.map((component, i) => renderComponentCard(component, i))}
        </div>
      </div>
    );
  }

  function segregateSections() {
    if (filteredComponents.length === 0) {
      return (
        <div className="empty">
          <p className="empty-title">{t('widgetManager.noResults', 'No results found')}</p>
          <p className={`empty-subtitle ${darkMode ? 'text-white-50' : 'text-secondary'}`}>
            {t(
              'widgetManager.tryAdjustingFilterMessage',
              "Try adjusting your search or filter to find what you're looking for."
            )}
          </p>
          <button
            className=" btn-sm tj-tertiary-btn mt-3"
            onClick={() => {
              setSearchQuery('');
              filterComponents('');
            }}
          >
            {t('widgetManager.clearQuery', 'clear query')}
          </button>
        </div>
      );
    }

    if (filteredComponents.length !== componentList.length) {
      return <>{renderList(filteredComponents)}</>;
    }

    const sections = Object.entries(sectionConfig).map(([key, config]) => ({
      title: config.title,
      items: filteredComponents.filter((component) => config.valueSet.has(component)),
    }));

    const items = [];
    sections.forEach((section) => {
      if (section.items.length > 0) {
        items.push({
          title: section.title,
          isOpen: true,
          children: renderList(section.items),
        });
      }
    });

    return (
      <div className="mt-3">
        <Accordion items={items} isTitleCase={false} />
      </div>
    );
  }

  // Remove handleChangeTab and related logic

  // Remove renderSection, replace with Tabs/Tab logic below

  // The picked library's components: ToolJet UI 1.0's sections, a pack's in the same sections, or a custom library's.
  function libraryComponents() {
    if (libraryChoice?.pack)
      return <PackSection key={libraryChoice.pack.pack} pack={libraryChoice.pack} searchQuery={searchQuery} />;
    if (!libraryChoice) return segregateSections();
    return (
      <div className="custom-components-tab">
        <LibrarySection
          key={libraryChoice.library.id}
          library={libraryChoice.library}
          searchQuery={searchQuery}
          picked
        />
      </div>
    );
  }

  const searchBox = () => {
    return (
      <div className={`input-icon tj-app-input ${isModuleEditor ? '' : 'mt-3'}`}>
        <SearchBox
          dataCy={`widget-search-box`}
          initialValue={''}
          callBack={(e) => handleSearchQueryChange(e.target.value)}
          onClearCallback={() => {
            setSearchQuery('');
            filterComponents('');
          }}
          placeholder={
            activeTab === 'components'
              ? t('globals.searchComponents', 'Search widgets')
              : t('globals.searchModules', 'Search modules')
          }
          customClass={`tj-widgets-search-input tj-text-xsm`}
          showClearButton={false}
          width={266}
        />
      </div>
    );
  };

  return (
    <div className={`components-container ${shouldFreeze ? 'disabled' : ''}`}>
      {isModuleEditor || edition === 'ce' ? (
        <>
          <div className="panel-header">
            <span className="panel-header-title">Components</span>
            <div className="panel-header-actions">
              <Button
                iconOnly
                leadingIcon="x"
                onClick={handleToggle}
                variant="ghost"
                size="medium"
                isLucid={true}
                data-cy="components-close-button"
              />
            </div>
          </div>
          {hasLibraryChoices && (
            <div className="tw-px-4 tw-pt-3">
              <LibraryPicker value={library} choices={choices} onChange={pickLibrary} />
            </div>
          )}
          {searchBox()}
          <div className="widgets-list col-sm-12 col-lg-12 row">{libraryComponents()}</div>
        </>
      ) : (
        <>
          <div className="panel-header">
            <span className="panel-header-title">Add new component</span>
            <div className="panel-header-actions">
              <Button
                iconOnly
                leadingIcon="x"
                onClick={handleToggle}
                variant="ghost"
                size="medium"
                isLucid={true}
                data-cy="components-close-button"
              />
            </div>
          </div>
          <Tabs
            activeKey={activeTab}
            onSelect={(key) => {
              setActiveTab(key);
            }}
            id="components-manager-tabs"
            darkMode={darkMode}
          >
            <Tab
              eventKey="components"
              title={
                hasLibraryChoices ? (
                  <LibraryPicker value={library} choices={choices} onChange={pickLibrary} />
                ) : (
                  (() => {
                    const str = t('globals.components', 'Components');
                    return str.charAt(0).toUpperCase() + str.slice(1);
                  })()
                )
              }
              darkMode={darkMode}
            >
              {searchBox()}
              <div className="widgets-list col-sm-12 col-lg-12 row">{libraryComponents()}</div>
            </Tab>
            {hasModuleAccess && (
              <Tab eventKey="modules" title={t('globals.modules', 'Modules')} darkMode={darkMode}>
                <ModuleErrorBoundary onError={() => setModuleError(true)}>
                  {searchBox()}
                  <ModuleManager searchQuery={searchQuery} />
                </ModuleErrorBoundary>
              </Tab>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};
