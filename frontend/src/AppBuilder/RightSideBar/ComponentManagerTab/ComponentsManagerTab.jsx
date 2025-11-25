import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { isEmpty, debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { LEGACY_ITEMS, IGNORED_ITEMS } from './constants';
import { componentTypes, componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import Fuse from 'fuse.js';
import { SearchBox } from '@/_components';
import { DragLayer } from './DragLayer';
import useStore from '@/AppBuilder/_stores/store';
import Accordion from '@/_ui/Accordion';
import sectionConfig from './sectionConfig';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ModuleManager } from '@/modules/Modules/components';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { useLicenseStore } from '@/_stores/licenseStore';
import { shallow } from 'zustand/shallow';
import Tabs from '@/ToolJetUI/Tabs/Tabs';
import Tab from '@/ToolJetUI/Tabs/Tab';
import './styles.scss';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
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
  const componentList = useMemo(() => {
    return componentTypes
      .map((component) => component.component)
      .filter((component) => !IGNORED_ITEMS.includes(component));
  }, [componentTypes]);

  const searchList = useMemo(() => {
    return componentTypes
      .filter((component) => !IGNORED_ITEMS.includes(component.component))
      .map((component) => {
        return { component: component.component, displayName: component.displayName };
      });
  }, [componentTypes]);

  const [filteredComponents, setFilteredComponents] = useState(componentList);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleError, setModuleError] = useState(false);
  const [activeTab, setActiveTab] = useState('components');
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

  // Force re-render when hasModuleAccess changes
  useEffect(() => {
    // If modules access is denied, nothing to do here now
  }, [hasModuleAccess]);

  useEffect(() => {
    setSearchQuery('');
    filterComponents('');
  }, [activeTab]);

  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);

  const handleSearchQueryChange = useCallback(
    debounce((value) => {
      setSearchQuery(value);
      // Filtering will be handled in the tab content
      filterComponents(value);
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

        // Find the indices of ToggleSwitchLegacy and ToggleSwitch
        const legacyIndex = componentList.findIndex((component) => component === 'ToggleSwitchLegacy');
        const toggleIndex = componentList.findIndex((component) => component === 'ToggleSwitch');

        // Swap the indices (if both are found)
        if (legacyIndex !== -1 && toggleIndex !== -1) {
          [componentList[legacyIndex], componentList[toggleIndex]] = [
            componentList[toggleIndex],
            componentList[legacyIndex],
          ];
        }
        setFilteredComponents(results.map((result) => result.item.component));
      } else {
        setFilteredComponents(componentList);
      }
    },
    [componentList]
  );

  const { t } = useTranslation();

  function renderComponentCard(component, index) {
    return (
      <div className="text-center align-items-center clearfix draggable-box-wrapper">
        <DragLayer index={index} component={componentTypeDefinitionMap[component]} key={component} />
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
              setFilteredComponents([]);
              handleSearchQueryChange('');
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

  const searchBox = () => {
    return (
      <div className={`input-icon tj-app-input`}>
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

  const closeIcon = () => {
    return (
      <ButtonComponent
        iconOnly
        leadingIcon={'x'}
        onClick={handleToggle}
        variant="ghost"
        fill="var(--icon-strong,#6A727C)"
        size="medium"
        data-cy="left-sidebar-close-button"
        isLucid={true}
      />
    );
  };

  return (
    <div className={`components-container ${shouldFreeze ? 'disabled' : ''}`}>
      {/* Header Section - Always rendered */}
      <div className={`components-header ${!false ? 'has-tabs' : ''}`}>
        {/* Row 1: Label + Close Button */}
        <div className="header-title-row">
          <p className="widgets-manager-header">Add new component</p>
          {closeIcon()}
        </div>

        {/* Row 2: Tabs (conditional) */}
        {!false && (
          <Tabs
            activeKey={activeTab}
            onSelect={(key) => {
              setActiveTab(key);
            }}
            id="components-manager-tabs"
            className="mt-2"
            darkMode={darkMode}
          >
            <Tab
              eventKey="components"
              title={(() => {
                const str = t('globals.components', 'Components');
                return str.charAt(0).toUpperCase() + str.slice(1);
              })()}
            />
            {hasModuleAccess && (
              <Tab eventKey="modules" title={t('globals.modules', 'Modules')} />
            )}
          </Tabs>
        )}
      </div>

      {/* Content - Outside Header */}
      {activeTab === 'components' && (
        <>
          {searchBox()}
          <div className="widgets-list col-sm-12 col-lg-12 row">{segregateSections()}</div>
        </>
      )}

      {activeTab === 'modules' && hasModuleAccess && (
        <ModuleErrorBoundary onError={() => setModuleError(true)}>
          {searchBox()}
          <ModuleManager searchQuery={searchQuery} />
        </ModuleErrorBoundary>
      )}
    </div>
  );
};
