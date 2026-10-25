import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { isEmpty, debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { LEGACY_ITEMS, IGNORED_ITEMS } from './constants';
import { componentTypes, componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import Fuse from 'fuse.js';
import { SearchBox } from '@/_components';
import { DragLayer } from './DragLayer';
import { LibrarySection } from './CustomComponentsTab';
import { LibraryPicker } from './LibraryPicker';
import { UI1, UI2, libraryChoices, resolveComponentLibrary, resolveLibraryChoice } from './componentLibrary';
import { hasLibraryContent } from './utils';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import useStore from '@/AppBuilder/_stores/store';
import Accordion from '@/_ui/Accordion';
import sectionConfig from './sectionConfig';
import { SHADCN_COMPONENTS } from '@/AppBuilder/WidgetManager/widgets/shadcn';

// Presets (component packs): a palette entry that adds a native widget with some styles set. The shadcn/ui Table is
// ToolJet's own Table in its shadcn look, so it keeps every Table feature and convention (the older ShadTable widget
// stays registered for apps that use it, but leaves the palette). The Google Map is the native Map in the pack's frame
// (it needs a Google Maps API key; the pack's own Map does not), named apart from it in the palette.
const SHADCN_TABLE = 'Table:shadcn';
const SHADCN_GOOGLE_MAP = 'Map:shadcn';
const PRESETS = {
  [SHADCN_TABLE]: { base: 'Table', stylePreset: { tableLook: 'shadcn' } },
  [SHADCN_GOOGLE_MAP]: { base: 'Map', stylePreset: { mapLook: 'shadcn' }, displayName: 'Google Map' },
};
const presetDefinition = (name) => {
  const preset = PRESETS[name];
  const base = preset && componentTypeDefinitionMap[preset.base];
  return base
    ? {
        ...base,
        stylePreset: preset.stylePreset,
        ...(preset.displayName ? { displayName: preset.displayName, presetLabel: preset.displayName } : {}),
      }
    : undefined;
};

export const SHADCN_SECTIONS = [
  { title: 'Page sections', items: ['ShadHero', 'ShadSummaryStrip', 'ShadCardGrid', 'ShadRecordList'] },
  {
    title: 'Layout',
    items: ['FlexContainer', 'ShadTabs', 'ShadListView', 'ShadDialog', 'ShadSeparator'],
  },
  { title: 'Typography', items: ['ShadHeading', 'ShadText'] },
  { title: 'Conversation', items: ['ShadChat', 'ShadQuestionnaire'] },
  {
    title: 'Data display',
    items: [
      SHADCN_TABLE,
      'ShadKanban',
      'ShadMap',
      SHADCN_GOOGLE_MAP,
      'ShadSchedule',
      'ShadStat',
      'ShadProgressList',
      'ShadBadge',
      'ShadAvatar',
      'ShadProgress',
      'ShadEmpty',
      'ShadSkeleton',
      'ShadKeyValue',
      'ShadTimeline',
      // Text sections from its items: it holds no components, so it is not in Layout with the containers.
      'ShadAccordion',
      'ShadTags',
      'ShadCircularProgress',
      'ShadSpinner',
      'ShadImage',
      'ShadIcon',
      'ShadCarousel',
      'ShadCalendar',
    ],
  },
  {
    title: 'Charts',
    items: [
      'ShadAreaChart',
      'ShadBarChart',
      'ShadLineChart',
      'ShadComboChart',
      'ShadPieChart',
      'ShadScatterChart',
      'ShadFunnelChart',
      'ShadHeatmapChart',
      'ShadRadarChart',
      'ShadRadialChart',
      'ShadSparkline',
    ],
  },
  {
    title: 'Inputs',
    items: [
      'ShadInput',
      'ShadTextarea',
      'ShadSelect',
      'ShadDatePicker',
      'ShadCheckbox',
      'ShadSwitch',
      'ShadRadioGroup',
      'ShadSlider',
      'ShadToggleGroup',
      'ShadNumberInput',
      'ShadPasswordInput',
      'ShadPhoneInput',
      'ShadCurrencyInput',
      'ShadOtpInput',
      'ShadTimePicker',
      'ShadDateTimePicker',
      'ShadCombobox',
      'ShadMultiselect',
      'ShadTagsInput',
      'ShadColorPicker',
      'ShadRating',
      'ShadFileUpload',
    ],
  },
  {
    title: 'Actions and navigation',
    items: [
      'ShadButton',
      'ShadButtonGroup',
      'ShadDropdownMenu',
      'ShadLink',
      'ShadNavigation',
      'ShadSteps',
      'ShadPagination',
      'ShadBreadcrumb',
      'ShadAlert',
    ],
  },
];

// Component libraries: the panel lists one library at a time, picked in a toggle above the search box. The pick is the
// app's saved library (globalSettings.componentLibrary, see componentLibrary.js), which AI builds also follow.
// A pack lists its own widgets plus FlexContainer, which composes them.
const COMPONENT_LIBRARIES = [
  { value: UI1, label: 'ToolJet UI 1.0' },
  {
    value: UI2,
    label: 'ToolJet UI 2.0',
    badge: 'Beta',
    sections: SHADCN_SECTIONS,
    components: [...SHADCN_COMPONENTS.filter((name) => name !== 'ShadTable'), SHADCN_TABLE, SHADCN_GOOGLE_MAP],
  },
];
// UI 2.0 widgets never appear in the ToolJet list.
const PACK_COMPONENTS = new Set(SHADCN_COMPONENTS);
const libraryComponentNames = (library) =>
  library.components ? new Set(['FlexContainer', ...library.components]) : null;
import { Button } from '@/components/ui/Button/Button';
import { ModuleManager } from '@/modules/Modules/components';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { useLicenseStore } from '@/_stores/licenseStore';
import { shallow } from 'zustand/shallow';
import Tabs from '@/ToolJetUI/Tabs/Tabs';
import Tab from '@/ToolJetUI/Tabs/Tab';
import Beta from '@/_ui/Beta';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
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

  // The app's library (componentLibrary.js): ToolJet UI 1.0 or 2.0, a component pack, or another custom library. Saved,
  // else inferred (an app that already holds a UI 2.0 widget opens on UI 2.0). A pick saves it, except in a frozen
  // editor, where it only changes the list. Without custom component libraries only UI 1.0 and 2.0 are offered.
  const libraries = useCustomComponentLibrariesStore((state) => state.libraries);
  useEffect(() => {
    if (hasCustomComponentLibrariesAccess) useCustomComponentLibrariesStore.getState().fetchLibraries();
  }, [hasCustomComponentLibrariesAccess]);
  const choices = useMemo(() => libraryChoices((libraries ?? []).filter(hasLibraryContent)), [libraries]);
  const savedLibrary = useStore((state) => state.globalSettings?.componentLibrary);
  const pages = useStore((state) => state.modules?.canvas?.pages);
  const globalSettingsChanged = useStore((state) => state.globalSettingsChanged);
  const appLibrary = useMemo(
    () =>
      hasCustomComponentLibrariesAccess
        ? resolveLibraryChoice(savedLibrary, choices, pages)
        : resolveComponentLibrary({ componentLibrary: savedLibrary }, pages).library,
    [hasCustomComponentLibrariesAccess, savedLibrary, choices, pages]
  );
  // The pick shows at once; it gives way to the app's library once that is saved or another app or version loads.
  const [pickedLibrary, setPickedLibrary] = useState(null);
  useEffect(() => setPickedLibrary(null), [appLibrary]);
  const libraryKey = pickedLibrary ?? appLibrary;
  const pickLibrary = (value) => {
    setPickedLibrary(value);
    if (value !== savedLibrary && !shouldFreeze) globalSettingsChanged({ componentLibrary: value });
  };
  const libraryChoice = [...choices.packs, ...choices.custom].find((choice) => choice.value === libraryKey);
  const library = COMPONENT_LIBRARIES.find((entry) => entry.value === libraryKey) ?? COMPONENT_LIBRARIES[0];

  // The widgets of the selected library: a pack's own widgets (and FlexContainer), or every native widget. A preset
  // belongs to the pack that lists it, so a search in ToolJet UI 1.0 does not offer the pack's Table or Google Map.
  const inLibrary = useCallback(
    (name) => {
      const names = libraryComponentNames(library);
      return names ? names.has(name) : !PACK_COMPONENTS.has(name) && !PRESETS[name];
    },
    [library]
  );

  const componentList = useMemo(() => {
    return [
      ...componentTypes
        .map((component) => component.component)
        .filter((component) => !IGNORED_ITEMS.includes(component) && inLibrary(component)),
      ...Object.keys(PRESETS).filter(inLibrary),
    ];
  }, [componentTypes, inLibrary]);

  const searchList = useMemo(() => {
    return [
      ...componentTypes
        .filter((component) => !IGNORED_ITEMS.includes(component.component) && inLibrary(component.component))
        .map((component) => {
          return { component: component.component, displayName: component.displayName };
        }),
      ...Object.keys(PRESETS)
        .filter(inLibrary)
        .map((name) => ({ component: name, displayName: presetDefinition(name)?.displayName ?? name })),
    ];
  }, [componentTypes, inLibrary]);

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
        <DragLayer index={index} component={presetDefinition(component) ?? componentTypeDefinitionMap[component]} />
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

    if (library.sections) {
      return (
        <div className="mt-3">
          <Accordion
            isTitleCase={false}
            items={library.sections
              .map((section) => ({
                title: section.title,
                isOpen: true,
                children: renderList(section.items.filter((name) => componentList.includes(name))),
              }))
              .filter((section) => section.children)}
          />
        </div>
      );
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

  const libraryPicker = () => (
    <div className="mt-3 d-flex align-items-center" style={{ width: 266, marginLeft: 16 }}>
      <ToggleGroup
        id="component-library-select"
        data-cy="component-library-select"
        aria-label="Component library"
        className="w-full"
        style={{ flex: 1 }}
        defaultValue={libraryKey}
        onValueChange={(value) => {
          // A click on the active item deselects it in a toggle group; keep a library picked.
          if (!value) return;
          pickLibrary(value);
          setSearchQuery('');
        }}
      >
        {COMPONENT_LIBRARIES.map((entry) => (
          <ToggleGroupItem
            key={entry.value}
            value={entry.value}
            style={{
              width: '100%',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* The toggle draws its children in a block: label and badge share one inline row. */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              {entry.label}
              {entry.badge ? <Beta className="tw-py-0.5 tw-px-1.5 tw-border-none" /> : null}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );

  // The picked library's components: Rocket 1.0's sections, or the library's own (a pack in the same sections).
  function libraryComponents() {
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
          {libraryPicker()}
          <React.Fragment key={libraryKey}>{searchBox()}</React.Fragment>
          <div className="widgets-list col-sm-12 col-lg-12 row">{segregateSections()}</div>
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
                hasCustomComponentLibrariesAccess ? (
                  <LibraryPicker value={libraryKey} choices={choices} onChange={pickLibrary} />
                ) : (
                  (() => {
                    const str = t('globals.components', 'Components');
                    return str.charAt(0).toUpperCase() + str.slice(1);
                  })()
                )
              }
              darkMode={darkMode}
            >
              {!hasCustomComponentLibrariesAccess && libraryPicker()}
              <React.Fragment key={libraryKey}>{searchBox()}</React.Fragment>
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
