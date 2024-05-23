import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { cloneDeep, isEmpty } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { allSources, source } from '../QueryEditors';
import DataSourcePicker from './DataSourcePicker';
import { Transformation } from './Transformation';
import Preview from './Preview';
import { ChangeDataSource } from './ChangeDataSource';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import { EventManager } from '@/Editor/Inspector/EventManager';
import { staticDataSources, customToggles, mockDataQueryAsComponent } from '../constants';
import { DataSourceTypes } from '../../DataSourceManager/SourceComponents';
import { useDataSources, useGlobalDataSources, useSampleDataSource } from '@/_stores/dataSourcesStore';
import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import { useSelectedQuery, useSelectedDataSource } from '@/_stores/queryPanelStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import SuccessNotificationInputs from './SuccessNotificationInputs';
import ParameterList from './ParameterList';

export const QueryManagerBody = ({
  darkMode,
  options,
  currentState,
  allComponents,
  apps,
  appDefinition,
  setOptions,
  activeTab,
}) => {
  const { t } = useTranslation();
  const dataSources = useDataSources();
  const globalDataSources = useGlobalDataSources();
  const sampleDataSource = useSampleDataSource();
  const paramListContainerRef = useRef(null);

  const selectedQuery = useSelectedQuery();
  const selectedDataSource = useSelectedDataSource();
  const { changeDataQuery, updateDataQuery } = useDataQueriesActions();

  const [dataSourceMeta, setDataSourceMeta] = useState(null);
  /* - Added the below line to cause re-rendering when the query is switched
       - QueryEditors are not updating when the query is switched
       - TODO: Remove the below line and make query editors update when the query is switched
       - Ref PR #6763
    */
  const [selectedQueryId, setSelectedQueryId] = useState(selectedQuery?.id);

  const queryName = selectedQuery?.name ?? '';
  const sourcecomponentName = selectedDataSource?.kind?.charAt(0).toUpperCase() + selectedDataSource?.kind?.slice(1);

  const ElementToRender = selectedDataSource?.pluginId ? source : allSources[sourcecomponentName];

  const defaultOptions = useRef({});

  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );

  useEffect(() => {
    setDataSourceMeta(
      selectedQuery?.pluginId
        ? selectedQuery?.manifestFile?.data?.source
        : DataSourceTypes.find((source) => source.kind === selectedQuery?.kind)
    );
    setSelectedQueryId(selectedQuery?.id);
    defaultOptions.current = selectedQuery?.options && JSON.parse(JSON.stringify(selectedQuery?.options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuery]);

  // Clear the focus field value from options
  const cleanFocusedFields = (newOptions) => {
    const diffFields = diff(newOptions, defaultOptions.current);
    const updatedOptions = { ...newOptions };
    Object.keys(diffFields).forEach((key) => {
      if (newOptions[key] === '' && defaultOptions.current[key] === undefined) {
        delete updatedOptions[key];
      }
    });
    return updatedOptions;
  };

  const validateNewOptions = (newOptions) => {
    const updatedOptions = cleanFocusedFields(newOptions);
    setOptions((options) => ({ ...options, ...updatedOptions }));

    updateDataQuery(cloneDeep({ ...options, ...updatedOptions }));
  };

  const optionchanged = (option, value) => {
    const newOptions = { ...options, [option]: value };
    validateNewOptions(newOptions);
  };

  const optionsChanged = (newOptions) => {
    validateNewOptions(newOptions);
  };

  const toggleOption = (option) => {
    const currentValue = selectedQuery?.options?.[option] ?? false;
    optionchanged(option, !currentValue);
  };
  const optionsChangedforParmas = (newOptions) => {
    setOptions(newOptions);
    updateDataQuery(cloneDeep(newOptions));
  };

  const handleAddParameter = (newParameter) => {
    const prevOptions = { ...options };
    //check if paramname already used
    if (!prevOptions?.parameters?.some((param) => param.name === newParameter.name)) {
      const newOptions = {
        ...prevOptions,
        parameters: [...(prevOptions?.parameters ?? []), newParameter],
      };
      optionsChangedforParmas(newOptions);
    }
  };

  const handleParameterChange = (index, updatedParameter) => {
    const prevOptions = { ...options };
    //check if paramname already used
    if (!prevOptions?.parameters?.some((param, idx) => param.name === updatedParameter.name && index !== idx)) {
      const updatedParameters = [...prevOptions.parameters];
      updatedParameters[index] = updatedParameter;
      optionsChangedforParmas({ ...prevOptions, parameters: updatedParameters });
    }
  };

  const handleParameterRemove = (index) => {
    const prevOptions = { ...options };
    const updatedParameters = prevOptions.parameters.filter((param, i) => index !== i);
    optionsChangedforParmas({ ...prevOptions, parameters: updatedParameters });
  };

  const renderDataSourcesList = () => {
    return (
      <div
        className={cx(`datasource-picker p-0`, {
          'disabled ': isVersionReleased,
        })}
      >
        <DataSourcePicker
          dataSources={dataSources}
          staticDataSources={staticDataSources}
          globalDataSources={globalDataSources}
          sampleDataSource={sampleDataSource}
          darkMode={darkMode}
        />
      </div>
    );
  };

  const renderTransformation = () => {
    if (
      dataSourceMeta?.disableTransformations ||
      selectedDataSource?.kind === 'runjs' ||
      selectedDataSource?.kind === 'runpy'
    )
      return;
    return (
      <Transformation
        changeOption={optionchanged}
        options={options ?? {}}
        currentState={currentState}
        darkMode={darkMode}
        queryId={selectedQuery?.id}
      />
    );
  };

  const handleBlur = () => {
    updateDataQuery(options);
  };

  const renderQueryElement = () => {
    return (
      <div
        className={cx({
          'disabled ': isVersionReleased,
        })}
      >
        <ElementToRender
          key={selectedQuery?.id}
          pluginSchema={selectedDataSource?.plugin?.operationsFile?.data}
          selectedDataSource={selectedDataSource}
          options={selectedQuery?.options}
          optionsChanged={optionsChanged}
          optionchanged={optionchanged}
          currentState={currentState}
          darkMode={darkMode}
          isEditMode={true} // Made TRUE always to avoid setting default options again
          queryName={queryName}
          onBlur={handleBlur} // Applies only to textarea, text box, etc. where `optionchanged` is triggered for every character change.
        />
      </div>
    );
  };

  const renderEventManager = () => {
    const queryComponent = mockDataQueryAsComponent(options?.events || []);
    return (
      <div className="d-flex">
        <div className={`form-label`}>{t('editor.queryManager.eventsHandler', 'Events')}</div>
        <div className="query-manager-events pb-4">
          <EventManager
            sourceId={selectedQuery?.id}
            eventSourceType="data_query" //check
            eventMetaDefinition={queryComponent.componentMeta}
            currentState={currentState}
            components={allComponents}
            callerQueryId={selectedQueryId}
            apps={apps}
            popoverPlacement="top"
            pages={
              appDefinition?.pages
                ? Object.entries(appDefinition?.pages).map(([id, page]) => ({
                    ...page,
                    id,
                  }))
                : []
            }
          />
        </div>
      </div>
    );
  };

  const renderQueryOptions = () => {
    return (
      <div>
        <div
          className={cx(`d-flex pb-1`, {
            'disabled ': isVersionReleased,
          })}
        >
          <div className="form-label">{t('editor.queryManager.settings', 'Triggers')}</div>
          <div className="flex-grow-1">
            {Object.keys(customToggles).map((toggle, index) => (
              <CustomToggleFlag
                {...customToggles[toggle]}
                toggleOption={toggleOption}
                value={selectedQuery?.options?.[customToggles[toggle]?.action]}
                index={index}
                key={toggle}
                darkMode={darkMode}
              />
            ))}
          </div>
        </div>
        <div className="d-flex">
          <div className="form-label">{}</div>
          <SuccessNotificationInputs
            currentState={currentState}
            options={options}
            darkMode={darkMode}
            optionchanged={optionchanged}
          />
        </div>
        {renderEventManager()}
      </div>
    );
  };

  const renderChangeDataSource = () => {
    const selectableDataSources = [...dataSources, ...globalDataSources, !!sampleDataSource && sampleDataSource]
      .filter(Boolean)
      .filter((ds) => ds.kind === selectedQuery?.kind);
    if (isEmpty(selectableDataSources)) {
      return '';
    }
    return (
      <>
        <div className="" ref={paramListContainerRef}>
          {selectedQuery && (
            <ParameterList
              parameters={options.parameters}
              handleAddParameter={handleAddParameter}
              handleParameterChange={handleParameterChange}
              handleParameterRemove={handleParameterRemove}
              currentState={currentState}
              darkMode={darkMode}
              containerRef={paramListContainerRef}
            />
          )}
        </div>
        <div
          className={cx('d-flex', { 'disabled ': isVersionReleased })}
          style={{ marginBottom: '16px', marginTop: '12px' }}
        >
          <div
            className={`d-flex query-manager-border-color hr-text-left py-2 form-label font-weight-500 change-data-source`}
          >
            Source
          </div>
          <div className="d-flex align-items-end" style={{ width: '364px' }}>
            <ChangeDataSource
              dataSources={selectableDataSources}
              value={selectedDataSource}
              onChange={(newDataSource) => {
                changeDataQuery(newDataSource);
              }}
            />
          </div>
        </div>
      </>
    );
  };

  if (selectedQueryId !== selectedQuery?.id) return;

  return (
    <div className={` query-details ${selectedDataSource?.kind === 'tooljetdb' ? 'tooljetdb-query-details' : ''}`}>
      {selectedQuery?.data_source_id && selectedDataSource !== null ? activeTab == 1 && renderChangeDataSource() : null}
      {selectedDataSource === null || !selectedQuery ? renderDataSourcesList() : activeTab == 1 && renderQueryElement()}
      {selectedDataSource === null || !selectedQuery
        ? renderDataSourcesList()
        : activeTab == 2 && renderTransformation()}

      {selectedDataSource !== null ? activeTab == 3 && renderQueryOptions() : null}
      <Preview darkMode={darkMode} />
    </div>
  );
};

const CustomToggleFlag = ({ dataCy, action, translatedLabel, label, value, toggleOption, darkMode, index }) => {
  const [flag, setFlag] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    setFlag(value);
  }, [value]);

  return (
    <div className={cx({ 'pb-3 pt-3': index === 1 })}>
      <CustomToggleSwitch
        dataCy={dataCy}
        isChecked={flag}
        toggleSwitchFunction={(flag) => {
          setFlag((state) => !state);
          toggleOption(flag);
        }}
        action={action}
        darkMode={darkMode}
        label={t(translatedLabel, label)}
      />
    </div>
  );
};
