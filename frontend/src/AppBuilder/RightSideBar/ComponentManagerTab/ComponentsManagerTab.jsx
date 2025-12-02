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
import { ComponentModuleTab } from '@/modules/Appbuilder/components';
import { useLicenseStore } from '@/_stores/licenseStore';
import { shallow } from 'zustand/shallow';

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

  const [filteredComponents, setFilteredComponents] = useState(componentList);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [moduleError, setModuleError] = useState(false);
  const _shouldFreeze = useStore((state) => state.getShouldFreeze());
  const isAutoMobileLayout = useStore((state) => state.currentLayout === 'mobile' && state.getIsAutoMobileLayout());
  const shouldFreeze = _shouldFreeze || isAutoMobileLayout;

  const { hasModuleAccess } = useLicenseStore(
    (state) => ({
      hasModuleAccess: state.hasModuleAccess,
    }),
    shallow
  );

  // Force re-render when hasModuleAccess changes
  useEffect(() => {
    // If modules access is denied and we're on the modules tab, switch to components
    if (!hasModuleAccess && activeTab === 2) {
      setActiveTab(1);
    }
  }, [hasModuleAccess, activeTab]);

  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);

  const handleSearchQueryChange = useCallback(
    debounce((value) => {
      setSearchQuery(value);
      if (activeTab === 1) {
        filterComponents(value);
      }
      // No need to filter modules here as we pass searchQuery to ModuleManager
    }, 125),
    [activeTab]
  );

  const handleToggle = () => {
    setActiveRightSideBarTab(null);
    setRightSidebarOpen(false);
  };

  const filterComponents = useCallback((value) => {
    if (value !== '') {
      const fuse = new Fuse(componentList, {
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
      setFilteredComponents(results.map((result) => result.item));
    } else {
      setFilteredComponents(componentList);
    }
  }, []);

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

  const handleChangeTab = (tab) => {
    if (tab === 2 && !hasModuleAccess) {
      setActiveTab(1);
      return;
    }
    setActiveTab(tab);
    if (tab === 1) setModuleError(false);
    // When changing tabs, we don't need to reset the search
    // The search query will be applied to the new tab
  };

  // Handle module errors by redirecting to components tab
  useEffect(() => {
    if (moduleError && activeTab === 2) {
      setActiveTab(1);
    }
  }, [moduleError, activeTab]);

  const renderSection = () => {
    if (activeTab === 1) {
      return <div className="widgets-list col-sm-12 col-lg-12 row">{segregateSections()}</div>;
    }

    // If there was an error accessing modules, redirect to components tab
    if (moduleError) {
      return <div className="widgets-list col-sm-12 col-lg-12 row">{segregateSections()}</div>;
    }

    return (
      <ModuleErrorBoundary onError={() => setModuleError(true)}>
        <ModuleManager searchQuery={searchQuery} />
      </ModuleErrorBoundary>
    );
  };

  return (
    <div className={`components-container ${shouldFreeze ? 'disabled' : ''}`}>
      <div className="d-flex align-items-center">
        {isModuleEditor ? (
          <p className="widgets-manager-header tw-w-full tw-pl-[16px]">Components</p>
        ) : (
          <ComponentModuleTab onChangeTab={handleChangeTab} hasModuleAccess={hasModuleAccess} />
        )}
        <div className="icon-btn cursor-pointer flex-shrink-0 me-3 p-2 h-4 w-4" onClick={handleToggle}>
          <SolidIcon fill="var(--icon-strong)" name={'remove03'} width="16" viewBox="0 0 16 16" />
        </div>
      </div>
      <div className="input-icon tj-app-input">
        <SearchBox
          dataCy={`widget-search-box`}
          initialValue={''}
          callBack={(e) => handleSearchQueryChange(e.target.value)}
          onClearCallback={() => {
            setSearchQuery('');
            if (activeTab === 1) {
              filterComponents('');
            }
          }}
          placeholder={
            activeTab === 1
              ? t('globals.searchComponents', 'Search widgets')
              : t('globals.searchModules', 'Search modules')
          }
          customClass={`tj-widgets-search-input tj-text-xsm`}
          showClearButton={false}
          width={266}
        />
      </div>
      {renderSection()}
    </div>
  );
};
