import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { isEmpty } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { allSources, source } from '../QueryEditors';
import DataSourcePicker from './DataSourcePicker';
import { Transformation } from './Transformation';
import Preview from './Preview';
import { ChangeDataSource } from './ChangeDataSource';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import { EventManager } from '@/Editor/Inspector/EventManager';
import { staticDataSources, customToggles, mockDataQueryAsComponent, RestAPIToggles } from '../constants';
import {
  DataSourceTypes,
  DataBaseSources,
  ApiSources,
  CloudStorageSources,
} from '../../DataSourceManager/SourceComponents';
import { useDataSources, useGlobalDataSources, useSampleDataSource } from '@/_stores/dataSourcesStore';
import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import { useSelectedQuery, useSelectedDataSource } from '@/_stores/queryPanelStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import SuccessNotificationInputs from './SuccessNotificationInputs';
import ParameterList from './ParameterList';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

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
  const [dataSourcesKinds, setDataSourcesKinds] = useState([]);
  const [userDefinedSources, setUserDefinedSources] = useState(
    [...dataSources, ...globalDataSources, !!sampleDataSource && sampleDataSource].filter(Boolean)
  );

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
    const shouldAddSampleDataSource = !!sampleDataSource;
    const allDataSources = [...dataSources, ...globalDataSources, shouldAddSampleDataSource && sampleDataSource].filter(
      Boolean
    );
    setUserDefinedSources(allDataSources);
    const dataSourceKindsList = [...DataBaseSources, ...ApiSources, ...CloudStorageSources];
    allDataSources.forEach(({ plugin }) => {
      //plugin names are fetched from list data source api call only
      if (isEmpty(plugin)) {
        return;
      }
      dataSourceKindsList.push({ name: plugin.name, kind: plugin.pluginId });
    });
    setDataSourcesKinds(dataSourceKindsList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources]);

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

    updateDataQuery(deepClone({ ...options, ...updatedOptions }));
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
  const optionsChangedforParams = (newOptions) => {
    setOptions(newOptions);
    updateDataQuery(deepClone(newOptions));
  };

  const handleAddParameter = (newParameter) => {
    const prevOptions = { ...options };
    //check if paramname already used
    if (!prevOptions?.parameters?.some((param) => param.name === newParameter.name)) {
      const newOptions = {
        ...prevOptions,
        parameters: [...(prevOptions?.parameters ?? []), newParameter],
      };
      optionsChangedforParams(newOptions);
    }
  };

  const handleParameterChange = (index, updatedParameter) => {
    const prevOptions = { ...options };
    //check if paramname already used
    if (!prevOptions?.parameters?.some((param, idx) => param.name === updatedParameter.name && index !== idx)) {
      const updatedParameters = [...prevOptions.parameters];
      updatedParameters[index] = updatedParameter;
      optionsChangedforParams({ ...prevOptions, parameters: updatedParameters });
    }
  };

  const handleParameterRemove = (index) => {
    const prevOptions = { ...options };
    const updatedParameters = prevOptions.parameters.filter((param, i) => index !== i);
    optionsChangedforParams({ ...prevOptions, parameters: updatedParameters });
  };
  const [previewHeight, setPreviewHeight] = useState(40); //preview non expanded height

  const calculatePreviewHeight = (height, previewPanelExpanded) => {
    setPreviewHeight(previewPanelExpanded ? height : 40);
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
        className={cx(
          {
            'disabled ': isVersionReleased,
          },
          'query-wrapper'
        )}
      >
        <div ref={paramListContainerRef} style={{ marginBottom: '16px' }}>
          {selectedQuery &&
            (selectedDataSource?.kind === 'runjs' ||
              selectedDataSource?.kind === 'runpy' ||
              selectedDataSource?.kind === 'tooljetdb' ||
              (selectedDataSource?.kind === 'restapi' && selectedDataSource?.type !== 'default')) && (
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
            popoverPlacement="auto"
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
            {selectedQuery?.kind === 'restapi' &&
              Object.keys(RestAPIToggles).map((toggle, index) => (
                <CustomToggleFlag
                  {...RestAPIToggles[toggle]}
                  toggleOption={toggleOption}
                  value={selectedQuery?.options?.[RestAPIToggles[toggle]?.action]}
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
    const isSampleDb = selectedDataSource?.type === DATA_SOURCE_TYPE.SAMPLE;
    const docLink = isSampleDb
      ? 'https://docs.tooljet.com/docs/data-sources/sample-data-sources'
      : selectedDataSource?.pluginId && selectedDataSource.pluginId.trim() !== ''
      ? `https://docs.tooljet.com/docs/marketplace/plugins/marketplace-plugin-${selectedDataSource?.kind}/`
      : `https://docs.tooljet.com/docs/data-sources/${selectedDataSource?.kind}`;
    const selectedDataSourceName =
      dataSourcesKinds.find((dsk) => dsk.kind === selectedDataSource.kind)?.name || selectedDataSource.kind;
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
            style={{ minWidth: '140px' }}
          >
            Source
          </div>
          <div className="d-flex flex-column align-items-start" style={{ width: '100%' }}>
            <ChangeDataSource
              dataSources={selectableDataSources}
              value={selectedDataSource}
              onChange={(newDataSource) => {
                changeDataQuery(newDataSource);
              }}
            />
            <div>
              {`To know more about querying ${selectedDataSourceName} data,`}
              &nbsp;
              <a
                href={docLink}
                target="_blank"
                style={{ marginLeft: '0px !important', color: 'hsl(226, 70.0%, 55.5%)', textDecoration: 'underline' }}
                rel="noreferrer"
              >
                {t('globals.readDocumentation', 'read documentation').toLowerCase()}
              </a>
            </div>
          </div>
        </div>
      </>
    );
  };

  if (selectedQueryId !== selectedQuery?.id) return;

  return (
    <div
      className={`query-details ${selectedDataSource?.kind === 'tooljetdb' ? 'tooljetdb-query-details' : ''}`}
      style={{ height: `calc(100% - ${previewHeight + 40}px)`, overflowY: 'auto' }} // 40px for preview header height
    >
      {selectedDataSource === null || !selectedQuery ? (
        renderDataSourcesList()
      ) : (
        <>
          {selectedQuery?.data_source_id && activeTab === 1 && renderChangeDataSource()}
          {activeTab === 1 && renderQueryElement()}
          {activeTab === 2 && renderTransformation()}
          {activeTab === 3 && renderQueryOptions()}
          <Preview darkMode={darkMode} calculatePreviewHeight={calculatePreviewHeight} />
        </>
      )}
    </div>
  );
};

const CustomToggleFlag = ({
  dataCy,
  action,
  translatedLabel,
  label,
  subLabel,
  value,
  toggleOption,
  darkMode,
  index,
}) => {
  const [flag, setFlag] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    setFlag(value);
  }, [value]);

  return (
    <div className="query-manager-settings-toggles">
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
        subLabel={subLabel}
      />
    </div>
  );
};
