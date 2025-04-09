import React, { useEffect, useState, useRef, useMemo } from 'react';
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
import { customToggles, mockDataQueryAsComponent, RestAPIToggles } from '../constants';
import { DataSourceTypes } from '@/modules/common/components/DataSourceComponents';
import SuccessNotificationInputs from './SuccessNotificationInputs';
import ParameterList from './ParameterList';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { canDeleteDataSource, canReadDataSource, canUpdateDataSource } from '@/_helpers';
import useStore from '@/AppBuilder/_stores/store';
import { EventManager } from '@/AppBuilder/RightSideBar/Inspector/EventManager';
import NotificationBanner from '@/_components/NotificationBanner';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

export const BaseQueryManagerBody = ({ darkMode, activeTab, renderCopilot = () => null }) => {
  const { t } = useTranslation();
  const dataSources = useStore((state) => state.dataSources);
  const globalDataSources = useStore((state) => state.globalDataSources);
  const sampleDataSource = useStore((state) => state.sampleDataSource);
  const paramListContainerRef = useRef(null);
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const selectedDataSource = useStore((state) => state.queryPanel.selectedDataSource);
  const changeDataQuery = useStore((state) => state.dataQuery.changeDataQuery);
  const updateDataQuery = useStore((state) => state.dataQuery.updateDataQuery);
  const [showLocalDataSourceDeprecationBanner, setshowLocalDataSourceDeprecationBanner] = useState(false);
  const options = useMemo(() => selectedQuery?.options, [selectedQuery]);
  const [dataSourceMeta, setDataSourceMeta] = useState(null);
  /* - Added the below line to cause re-rendering when the query is switched
       - QueryEditors are not updating when the query is switched
       - TODO: Remove the below line and make query editors update when the query is switched
       - Ref PR #6763
    */
  const [selectedQueryId, setSelectedQueryId] = useState(selectedQuery?.id);

  const queryName = selectedQuery?.name ?? '';
  const sourcecomponentName = selectedDataSource?.kind?.charAt(0).toUpperCase() + selectedDataSource?.kind?.slice(1);

  const ElementToRender = selectedDataSource?.plugin_id ? source : allSources[sourcecomponentName];
  const defaultOptions = useRef({});

  const isFreezed = useStore((state) => state.getShouldFreeze());

  useEffect(() => {
    setDataSourceMeta(
      selectedQuery?.plugin_id
        ? selectedQuery?.manifest_file?.data?.source
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
  const [previewHeight, setPreviewHeight] = useState(40);

  const calculatePreviewHeight = (height, previewPanelExpanded) => {
    setPreviewHeight(previewPanelExpanded ? height : 40);
  };
  const renderDataSourcesList = () => {
    return (
      <div
        className={cx(`datasource-picker p-0`, {
          'disabled ': isFreezed,
        })}
      >
        <DataSourcePicker darkMode={darkMode} />
        <div className="pb-5" />
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
        renderCopilot={renderCopilot}
        changeOption={optionchanged}
        options={options ?? {}}
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
          'disabled ': isFreezed,
        })}
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
                darkMode={darkMode}
                containerRef={paramListContainerRef}
              />
            )}
        </div>
        <ElementToRender
          renderCopilot={renderCopilot}
          key={selectedQuery?.id}
          pluginSchema={selectedDataSource?.plugin?.operations_file?.data}
          selectedDataSource={selectedDataSource}
          options={selectedQuery?.options}
          optionsChanged={optionsChanged}
          optionchanged={optionchanged}
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
      <div
        className={cx('d-flex', {
          'disabled ': isFreezed,
        })}
      >
        <div className={`form-label`}>{t('editor.queryManager.eventsHandler', 'Events')}</div>
        <div className="query-manager-events pb-4">
          <EventManager
            sourceId={selectedQuery?.id}
            eventSourceType="data_query" //check
            eventMetaDefinition={queryComponent.componentMeta}
            callerQueryId={selectedQueryId}
            popoverPlacement="auto"
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
            'disabled ': isFreezed,
          })}
        >
          <div className="form-label mt-2">{t('editor.queryManager.settings', 'Triggers')}</div>
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
            // currentState={currentState}
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
      : selectedDataSource?.plugin_id && selectedDataSource.plugin_id.trim() !== ''
      ? `https://docs.tooljet.com/docs/marketplace/plugins/marketplace-plugin-${selectedDataSource?.kind}/`
      : `https://docs.tooljet.com/docs/data-sources/${selectedDataSource?.kind}`;
    return (
      <>
        <div className="" ref={paramListContainerRef}>
          {selectedQuery && !showLocalDataSourceDeprecationBanner && (
            <ParameterList
              parameters={options.parameters}
              handleAddParameter={handleAddParameter}
              handleParameterChange={handleParameterChange}
              handleParameterRemove={handleParameterRemove}
              darkMode={darkMode}
              containerRef={paramListContainerRef}
            />
          )}
        </div>
        <div className={cx('d-flex', { 'disabled ': isFreezed })} style={{ marginBottom: '16px', marginTop: '12px' }}>
          <div
            className={`d-flex query-manager-border-color hr-text-left py-2 form-label font-weight-500 change-data-source`}
          >
            Source
          </div>
          <div className="d-flex flex-column align-items-start" style={{ width: '500px' }}>
            <ChangeDataSource
              dataSources={selectableDataSources}
              value={selectedDataSource}
              onChange={(newDataSource) => {
                changeDataQuery(newDataSource);
              }}
            />
            <div>
              {`To know more about querying ${selectedDataSource?.kind} data,`}
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
  useEffect(() => {
    const staticDataSources = ['runjs', 'runpy', 'tooljetdb'];
    // added specific check for rest api - as it is a part of both : default and global data sources
    const showDeprecationBanner =
      selectedDataSource == null &&
      selectedQuery &&
      !staticDataSources.includes(selectedDataSource?.kind) &&
      (selectedDataSource?.kind !== 'restapi' || selectedDataSource?.type !== 'default');

    if (showDeprecationBanner) {
      setshowLocalDataSourceDeprecationBanner(true);
    } else {
      setshowLocalDataSourceDeprecationBanner(false);
    }
  }, [selectedDataSource, selectedQuery]);
  // if (selectedQueryId !== selectedQuery?.id) return;
  const hasPermissions =
    selectedDataSource?.scope === 'global' && selectedDataSource?.type !== DATA_SOURCE_TYPE.SAMPLE
      ? canUpdateDataSource(selectedQuery?.data_source_id) ||
        canReadDataSource(selectedQuery?.data_source_id) ||
        canDeleteDataSource()
      : true;

  return (
    <div
      className={`query-details ${selectedDataSource?.kind === 'tooljetdb' ? 'tooljetdb-query-details' : ''} ${
        !hasPermissions || isFreezed ? 'disabled' : ''
      }`}
      style={{
        height: `calc(100% - ${selectedQuery ? previewHeight + 40 : 0}px)`,
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }} // 40px for preview header height
    >
      {selectedDataSource === null || !selectedQuery ? (
        showLocalDataSourceDeprecationBanner ? (
          <>
            <NotificationBanner enhanceDisabledVisibility={!hasPermissions || isFreezed} darkMode={darkMode} />
            {renderChangeDataSource()}
          </>
        ) : (
          renderDataSourcesList()
        )
      ) : (
        <>
          {selectedQuery?.data_source_id &&
            selectedDataSource?.type !== DATA_SOURCE_TYPE.STATIC &&
            activeTab === 1 &&
            renderChangeDataSource()}
          {activeTab === 1 && renderQueryElement()}
          {activeTab === 2 && renderTransformation()}
          {activeTab === 3 && renderQueryOptions()}
          <Preview darkMode={darkMode} calculatePreviewHeight={calculatePreviewHeight} />
        </>
      )}
    </div>
  );
};

const CustomToggleFlag = ({ dataCy, action, translatedLabel, label, subLabel, value, toggleOption, darkMode }) => {
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

const QueryManagerBody = withEditionSpecificComponent(BaseQueryManagerBody, 'Appbuilder');

export default QueryManagerBody;
