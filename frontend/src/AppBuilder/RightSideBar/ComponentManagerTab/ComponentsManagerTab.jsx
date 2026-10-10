import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { isEmpty, debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { LEGACY_ITEMS, IGNORED_ITEMS } from './constants';
import { componentTypes, componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import Fuse from 'fuse.js';
import { SearchBox } from '@/_components';
import { DragLayer } from './DragLayer';
import { CustomComponentsTab } from './CustomComponentsTab';
import useStore from '@/AppBuilder/_stores/store';
import Accordion from '@/_ui/Accordion';
import sectionConfig from './sectionConfig';
import { ANT_DESIGN_COMPONENTS } from '@/AppBuilder/WidgetManager/widgets/antDesign';
import { SHADCN_COMPONENTS } from '@/AppBuilder/WidgetManager/widgets/shadcn';

// Ant Design pack (experiment): its own tab, grouped like the native components.
const ANT_DESIGN_SECTIONS = [
  { title: 'Layout', items: ['FlexContainer', 'AntCard', 'AntDivider', 'AntCollapse'] },
  { title: 'Typography', items: ['AntTitle', 'AntText'] },
  {
    title: 'Data display',
    items: [
      'AntTable',
      'AntList',
      'AntDescriptions',
      'AntStatistic',
      'AntTag',
      'AntBadge',
      'AntAvatar',
      'AntProgress',
      'AntTimeline',
      'AntTree',
      'AntCalendar',
      'AntImage',
      'AntQRCode',
      'AntEmpty',
      'AntSkeleton',
    ],
  },
  { title: 'Charts', items: ['AntLineChart', 'AntColumnChart', 'AntPieChart', 'AntGaugeChart', 'AntFunnelChart'] },
  {
    title: 'Inputs',
    items: [
      'AntInput',
      'AntTextArea',
      'AntInputNumber',
      'AntSelect',
      'AntAutoComplete',
      'AntCascader',
      'AntTreeSelect',
      'AntDatePicker',
      'AntRangePicker',
      'AntTimePicker',
      'AntCheckbox',
      'AntRadio',
      'AntSwitch',
      'AntSegmented',
      'AntSlider',
      'AntRate',
      'AntColorPicker',
      'AntUpload',
    ],
  },
  {
    title: 'Actions and feedback',
    items: ['AntButton', 'AntAlert', 'AntResult', 'AntSteps', 'AntPagination', 'AntBreadcrumb'],
  },
];

const SHADCN_SECTIONS = [
  { title: 'Layout', items: ['FlexContainer', 'ShadSeparator', 'ShadAccordion'] },
  { title: 'Typography', items: ['ShadHeading', 'ShadText'] },
  {
    title: 'Data display',
    items: ['ShadTable', 'Kanban', 'ShadStat', 'ShadBadge', 'ShadAvatar', 'ShadProgress', 'ShadEmpty', 'ShadSkeleton'],
  },
  { title: 'Charts', items: ['ShadAreaChart', 'ShadBarChart', 'ShadPieChart'] },
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
    ],
  },
  { title: 'Actions and feedback', items: ['ShadButton', 'ShadAlert', 'ShadBreadcrumb'] },
];

// Component libraries (experiment): the panel lists one library at a time, picked in a dropdown above the search box.
// A pack lists its own widgets plus FlexContainer, which composes them.
const COMPONENT_LIBRARIES = [
  { value: 'tooljet', label: 'ToolJet' },
  { value: 'antd', label: 'Ant Design', sections: ANT_DESIGN_SECTIONS, components: ANT_DESIGN_COMPONENTS },
  {
    value: 'shadcn',
    label: 'shadcn/ui',
    sections: SHADCN_SECTIONS,
    components: SHADCN_COMPONENTS,
    // Native containers the library offers in its own look: they keep their child slots, actions and events. The
    // Kanban's card modal starts off: on by default it opens an empty dialog until someone fills it.
    presets: { Kanban: { skin: 'shadcn', openModalOnCardClick: '{{false}}' } },
  },
];
const PACK_COMPONENTS = new Set(COMPONENT_LIBRARIES.flatMap((library) => library.components ?? []));
const libraryComponentNames = (library) =>
  library.components ? new Set(['FlexContainer', ...library.components, ...Object.keys(library.presets ?? {})]) : null;
import { Button } from '@/components/ui/Button/Button';
import { ModuleManager } from '@/modules/Modules/components';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { useLicenseStore } from '@/_stores/licenseStore';
import { shallow } from 'zustand/shallow';
import Tabs from '@/ToolJetUI/Tabs/Tabs';
import Tab from '@/ToolJetUI/Tabs/Tab';
import Beta from '@/_ui/Beta';
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

  const [libraryKey, setLibraryKey] = useState('tooljet');
  const library = COMPONENT_LIBRARIES.find((entry) => entry.value === libraryKey) ?? COMPONENT_LIBRARIES[0];

  // The widgets of the selected library: a pack's own widgets (and FlexContainer), or every native widget.
  const inLibrary = useCallback(
    (name) => {
      const names = libraryComponentNames(library);
      return names ? names.has(name) : !PACK_COMPONENTS.has(name);
    },
    [library]
  );

  const componentList = useMemo(() => {
    return componentTypes
      .map((component) => component.component)
      .filter((component) => !IGNORED_ITEMS.includes(component) && inLibrary(component));
  }, [componentTypes, inLibrary]);

  const searchList = useMemo(() => {
    return componentTypes
      .filter((component) => !IGNORED_ITEMS.includes(component.component) && inLibrary(component.component))
      .map((component) => {
        return { component: component.component, displayName: component.displayName };
      });
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
        <DragLayer
          index={index}
          component={
            library.presets?.[component]
              ? { ...componentTypeDefinitionMap[component], presetProperties: library.presets[component] }
              : componentTypeDefinitionMap[component]
          }
        />
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
    <div className="mt-3 d-flex align-items-center" style={{ gap: 8, width: 266, marginLeft: 16 }}>
      <label
        htmlFor="component-library-select"
        className="tj-text-xsm mb-0"
        style={{ color: 'var(--text-placeholder)' }}
      >
        Library
      </label>
      <select
        id="component-library-select"
        data-cy="component-library-select"
        className="form-select form-select-sm tj-text-xsm"
        style={{ flex: 1 }}
        value={libraryKey}
        onChange={(event) => {
          setLibraryKey(event.target.value);
          setSearchQuery('');
        }}
      >
        {COMPONENT_LIBRARIES.map((entry) => (
          <option key={entry.value} value={entry.value}>
            {entry.label}
          </option>
        ))}
      </select>
    </div>
  );

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
              : activeTab === 'custom'
              ? t('globals.searchCustomComponents', 'Search components')
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
              title={(() => {
                const str = t('globals.components', 'Components');
                return str.charAt(0).toUpperCase() + str.slice(1);
              })()}
              darkMode={darkMode}
            >
              {libraryPicker()}
              <React.Fragment key={libraryKey}>{searchBox()}</React.Fragment>
              <div className="widgets-list col-sm-12 col-lg-12 row">{segregateSections()}</div>
            </Tab>
            {hasModuleAccess && (
              <Tab eventKey="modules" title={t('globals.modules', 'Modules')} darkMode={darkMode}>
                <ModuleErrorBoundary onError={() => setModuleError(true)}>
                  {searchBox()}
                  <ModuleManager searchQuery={searchQuery} />
                </ModuleErrorBoundary>
              </Tab>
            )}
            {hasCustomComponentLibrariesAccess && (
              <Tab
                eventKey="custom"
                title={
                  <>
                    {t('globals.custom', 'Custom')}
                    <Beta className="tw-py-0.5 tw-px-1.5 tw-border-none tw-ml-0.5" />
                  </>
                }
                darkMode={darkMode}
              >
                {searchBox()}
                <CustomComponentsTab searchQuery={searchQuery} />
              </Tab>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};
