import React, { useCallback, useMemo, useState } from 'react';
import { isEmpty, debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { LEGACY_ITEMS } from './constants';
import { componentTypes, componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import Fuse from 'fuse.js';
import { SearchBox } from '@/_components';
import { DragLayer } from './DragLayer';
import useStore from '@/AppBuilder/_stores/store';
import Accordion from '@/_ui/Accordion';
import sectionConfig from './sectionConfig';

// TODO: Hardcode all the component-section mapping in a constant file and just loop over it
// TODO: styling
// TODO: scrolling
// TODO: searching

export const ComponentsManagerTab = ({ darkMode }) => {
  const componentList = useMemo(() => {
    return componentTypes.map((component) => component.component);
  }, [componentTypes]);

  const [filteredComponents, setFilteredComponents] = useState(componentList);
  const _shouldFreeze = useStore((state) => state.getShouldFreeze());
  const isAutoMobileLayout = useStore((state) => state.currentLayout === 'mobile' && state.getIsAutoMobileLayout());
  const shouldFreeze = _shouldFreeze || isAutoMobileLayout;

  const handleSearchQueryChange = useCallback(
    debounce((e) => {
      const { value } = e.target;
      filterComponents(value);
    }, 125),
    []
  );

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
        <Accordion items={items} />
      </div>
    );
  }

  return (
    <div className={`components-container ${shouldFreeze ? 'disabled' : ''}`}>
      <div style={{ marginLeft: '16px', marginRight: '16px' }}>
        <p className="widgets-manager-header">Components</p>
        <div className="input-icon tj-app-input">
          <SearchBox
            dataCy={`widget-search-box`}
            initialValue={''}
            callBack={(e) => handleSearchQueryChange(e)}
            onClearCallback={() => {
              filterComponents('');
            }}
            placeholder={t('globals.searchComponents', 'Search widgets')}
            customClass={`tj-widgets-search-input  tj-text-xsm`}
            showClearButton={false}
            width={266}
          />
        </div>
      </div>
      <div className="widgets-list col-sm-12 col-lg-12 row">{segregateSections()}</div>
    </div>
  );
};
