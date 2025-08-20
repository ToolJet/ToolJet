import React from 'react';
import { Tab, ListGroup, Row, OverlayTrigger, Tooltip } from 'react-bootstrap';
import cx from 'classnames';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';
import ArrowUpDown from '@/_ui/Icon/solidIcons/ArrowUpDown';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import './grpcv2.scss';

const HierarchicalDropdown = ({ options, value, onChange, placeholder, disabled, darkMode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [expandedServices, setExpandedServices] = React.useState(() =>
    new Set(options.map(service => service.label))
  );
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    setExpandedServices(new Set(options.map(service => service.label)));
  }, [options]);

  React.useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setExpandedServices(new Set());
    }
  }, [disabled]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleService = (serviceName) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceName)) {
      newExpanded.delete(serviceName);
    } else {
      newExpanded.add(serviceName);
    }
    setExpandedServices(newExpanded);
  };

  const selectMethod = (methodOption) => {
    if (methodOption.disabled) return;
    onChange(methodOption);
    setTimeout(() => setIsOpen(false), 0);
  };

  const getDisplayValue = () => {
    if (disabled) return placeholder;

    const selectedMethod = options
      .flatMap(service => service.methods)
      .find(method => method.value === value);
    return selectedMethod ? `${selectedMethod.serviceName} → ${selectedMethod.label}` : placeholder;
  };

  return (
    <div ref={dropdownRef} className={cx('grpcv2-dropdown', {
      'grpcv2-dropdown--dark': darkMode
    })}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cx('grpcv2-dropdown__button', {
          'grpcv2-dropdown__button--open': isOpen
        })}
      >
        <span className="grpcv2-dropdown__button__text">
          {getDisplayValue()}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={cx('grpcv2-dropdown__button__arrow', {
            'grpcv2-dropdown__button__arrow--open': isOpen
          })}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="#6a727c"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="grpcv2-dropdown__menu">
          {options.map((service, index) => (
            <React.Fragment key={service.value}>
              {index > 0 && (
                <div className="grpcv2-dropdown__separator" />
              )}
              <div>
                <div
                  onClick={() => toggleService(service.label)}
                  className="grpcv2-dropdown__service"
                >
                  <span className="grpcv2-dropdown__service__name">{service.label}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className={cx('grpcv2-dropdown__service__arrow', {
                      'grpcv2-dropdown__service__arrow--collapsed': !expandedServices.has(service.label)
                    })}
                  >
                    <path
                      d="M5 8l5-5 5 5"
                      stroke="#687076"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {expandedServices.has(service.label) && service.methods.map((method) => (
                  <div
                    key={method.value}
                    onClick={() => !method.disabled && selectMethod(method)}
                    className={cx('grpcv2-dropdown__method', {
                      'grpcv2-dropdown__method--disabled': method.disabled,
                      'grpcv2-dropdown__method--selected': method.value === value
                    })}
                  >
                    <ArrowUpDown
                      width="20"
                      fill={method.isStreaming ? "#889096" : "#4368e3"}
                    />
                    {method.disabled ? (
                      <OverlayTrigger
                        placement="right"
                        overlay={
                          <Tooltip id={`tooltip-${method.value}`} className="grpcv2-streaming-tooltip">
                            Streaming RPCs are not supported currently
                          </Tooltip>
                        }
                      >
                        <span className="grpcv2-dropdown__method__name">{method.label}</span>
                      </OverlayTrigger>
                    ) : (
                      <span className="grpcv2-dropdown__method__name">{method.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const GRPCv2Component = ({ darkMode, selectedDataSource, ...restProps }) => {
  const { options, optionsChanged, queryName, currentEnvironment } = restProps;
  const serverUrl = selectedDataSource?.options?.url?.value;

  const [servicesData, setServicesData] = React.useState({ services: [] });
  const [selectedService, setSelectedService] = React.useState(null);
  const [selectedMethod, setSelectedMethod] = React.useState(null);
  const [isLoadingServices, setIsLoadingServices] = React.useState(false);
  const currentRequestRef = React.useRef(null);
  const [metadata, setMetadata] = React.useState(() => {
    if (options?.metadata) {
      // Handle both array format (new) and JSON string format (backward compatibility)
      if (Array.isArray(options.metadata)) {
        return options.metadata;
      } else if (typeof options.metadata === 'string') {
        try {
          return JSON.parse(options.metadata);
        } catch (error) {
          console.warn('Failed to parse metadata JSON, using default:', error);
        }
      }
    }
    return [['', '']];
  });


  // Handle query switching - reset state when switching to a different query
  React.useEffect(() => {
    // Update metadata when options change
    if (options?.metadata) {
      // Handle both array format (new) and JSON string format (backward compatibility)
      if (Array.isArray(options.metadata)) {
        setMetadata(options.metadata);
      } else if (typeof options.metadata === 'string') {
        try {
          const newMetadata = JSON.parse(options.metadata);
          setMetadata(newMetadata);
        } catch (error) {
          console.warn('Invalid metadata JSON:', error);
          setMetadata([['', '']]);
        }
      } else {
        setMetadata([['', '']]);
      }
    } else {
      setMetadata([['', '']]);
    }
  }, [options?.metadata, queryName]);

  const loadServices = React.useCallback(async () => {
    if (!selectedDataSource?.id) return;

    if (!selectedDataSource?.options?.url?.value) {
      toast.error('Please configure the server URL in your data source settings');
      return;
    }

    // Create a unique request ID
    const requestId = Date.now() + Math.random();
    currentRequestRef.current = requestId;

    setIsLoadingServices(true);

    try {
      const result = await dataqueryService.invoke(selectedDataSource.id, 'discoverServices', currentEnvironment?.id);

      if (result.status === 'failed') {
        throw new Error(result.errorMessage || 'Failed to discover services');
      }

      const servicesArray = Array.isArray(result.data) ? result.data : (result.data || []);
      let restoredService = null;
      let restoredMethod = null;

      if (options?.service && servicesArray.length > 0) {
        const foundService = servicesArray.find(s => s.name === options.service);
        if (foundService) {
          restoredService = foundService;

          if (options?.method) {
            const foundMethod = foundService.methods.find(m => m.name === options.method);
            if (foundMethod) {
              restoredMethod = foundMethod;
            }
          }
        }
      }

      // Only update state if this request is still current
      if (currentRequestRef.current === requestId) {
        setServicesData({ services: servicesArray });
        setSelectedService(restoredService);
        setSelectedMethod(restoredMethod);
      }
    } catch (error) {
      // Don't show error if request was superseded by a new request
      if (currentRequestRef.current !== requestId) {
        return;
      }

      console.error('Failed to load services:', error);
      const errorMessage = error.errorMessage || error.message || 'Failed to load services';
      toast.error(errorMessage);
    } finally {
      // Only update loading state if this request is still current
      if (currentRequestRef.current === requestId) {
        setIsLoadingServices(false);
      }
    }
  }, [selectedDataSource?.id, selectedDataSource?.options?.url?.value, options?.service, options?.method]);

  React.useEffect(() => {
    setIsLoadingServices(true);
    setServicesData({ services: [] });
    setSelectedService(null);
    setSelectedMethod(null);
  }, [selectedDataSource?.id]);

  React.useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Cleanup on unmount or when dependencies change
  React.useEffect(() => {
    return () => {
      // Invalidate any pending requests when component unmounts or query changes
      currentRequestRef.current = null;
    };
  }, [queryName, selectedDataSource?.id]);

  const selectMethod = (selectedOption) => {
    if (!selectedOption || selectedOption.type !== 'method') {
      return;
    }

    const { serviceName, methodName, method } = selectedOption;
    const service = servicesData.services.find(s => s.name === serviceName);

    setSelectedService(service);
    setSelectedMethod(method);

    optionsChanged({
      ...options,
      service: serviceName,
      method: methodName,
    });
  };

  const getSelectionValue = () => {
    if (selectedService && selectedMethod) {
      return `${selectedService.name}:${selectedMethod.name}`;
    }
    return '';
  };

  const addMetadata = () => {
    const currentMetadata = [...metadata];
    currentMetadata.push(['', '']);
    setMetadata(currentMetadata);
    // Persist the change to options (send as array like REST API headers)
    optionsChanged({
      ...options,
      metadata: currentMetadata,
    });
  };

  const removeMetadata = (index) => {
    const currentMetadata = [...metadata];
    currentMetadata.splice(index, 1);
    setMetadata(currentMetadata);
    // Persist the change to options (send as array like REST API headers)
    optionsChanged({
      ...options,
      metadata: currentMetadata,
    });
  };

  const updateMetadata = (type, index, value) => {
    const currentMetadata = metadata.map((item, i) => {
      if (i === index) {
        const newItem = [...item]; // Create new array for this item
        newItem[type === 'key' ? 0 : 1] = value;
        return newItem;
      }
      return [...item]; // Create new array for all items to avoid mutation
    });

    setMetadata(currentMetadata);
    optionsChanged({
      ...options,
      metadata: currentMetadata,
    });
  };

  const handleRawMessageChanged = (value) => {
    const updatedOptions = {
      ...options,
      raw_message: value,
    };

    optionsChanged(updatedOptions);
  };

  const hierarchicalOptions = servicesData.services.map(service => ({
    type: 'service',
    label: service.name,
    value: `service:${service.name}`,
    service: service,
    methods: service.methods
      .map(method => ({
        type: 'method',
        label: method.name,
        value: `${service.name}:${method.name}`,
        serviceName: service.name,
        methodName: method.name,
        disabled: method.requestStreaming || method.responseStreaming,
        isStreaming: method.requestStreaming || method.responseStreaming,
        method: method,
      }))
      .sort((a, b) => {
        if (a.disabled && !b.disabled) return 1;
        if (!a.disabled && b.disabled) return -1;
        return a.label.localeCompare(b.label);
      })
  }));

  return (
    <div className="grpcv2-container">
      <div className="d-flex grpcv2-request-section">
        <div className="d-flex query-manager-border-color hr-text-left py-2 form-label font-weight-500">
          Request
        </div>
        <div className="d-flex flex-column align-items-start grpcv2-request-section__content">
          <div className="d-flex grpcv2-request-section__fields">
            <div className={cx('grpcv2-server-url', {
              'grpcv2-server-url--dark': darkMode
            })}>
              <span className="grpcv2-server-url__text">
                {serverUrl || 'localhost:50051'}
              </span>
            </div>

            <div className="flex-grow-1">
              <HierarchicalDropdown
                options={hierarchicalOptions}
                value={getSelectionValue()}
                onChange={selectMethod}
                placeholder={
                  isLoadingServices ? "Loading services..." :
                    hierarchicalOptions.length === 0 ? "No services found" :
                      "Select service"
                }
                disabled={isLoadingServices || hierarchicalOptions.length === 0}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={cx('query-pane-restapi-tabs', { dark: darkMode })}>
        <GRPCv2Component.Tabs
          theme={darkMode ? 'monokai' : 'default'}
          metadata={metadata}
          onChange={updateMetadata}
          onRawMessageChange={handleRawMessageChanged}
          removeKeyValuePair={removeMetadata}
          addNewKeyValuePair={addMetadata}
          darkMode={darkMode}
          componentName={queryName}
          rawMessage={options?.raw_message || '{\n\n}'}
        />
      </div>
    </div>
  );
};

const ControlledTabs = ({
  metadata,
  theme,
  onChange,
  onRawMessageChange,
  removeKeyValuePair,
  addNewKeyValuePair,
  darkMode,
  componentName,
  rawMessage,
}) => {
  const [key, setKey] = React.useState('request');
  const tabs = ['Request', 'Metadata'];

  return (
    <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="request">
      <Row className="tw-ml-0">
        <div className="keys d-flex justify-content-between query-pane-tabs-header">
          <ListGroup className="query-pane-rest-api-keys-list-group mx-1 mb-2" variant="flush">
            {tabs.map((tab) => (
              <ListGroup.Item key={tab} eventKey={tab.toLowerCase()}>
                <span>{tab}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <div className="text-nowrap d-flex align-items-center">
            {key === 'metadata' && (
              <ButtonSolid
                onClick={() => addNewKeyValuePair()}
                id="grpc-metadata-add-btn"
                data-cy="grpc-add-metadata-button"
                variant="ghostBlack"
                size="sm"
                leftIcon="plus"
                fill={darkMode ? 'var(--icons-default)' : '#6A727C'}
                iconWidth="18"
                className="tw-px-[6px]"
              />
            )}
          </div>
        </div>

        <div className="col tw-pl-0">
          <Tab.Content
            bsPrefix="rest-api-tab-content"
            className="query-manager-border-color rounded"
          >
            <Tab.Pane eventKey="metadata" bsPrefix="rest-api-tabpanes" transition={false}>
              <GRPCv2Component.TabContent
                options={metadata}
                theme={theme}
                removeKeyValuePair={removeKeyValuePair}
                onChange={onChange}
                componentName={componentName}
                tabType={'metadata'}
                paramType={'metadata'}
                addNewKeyValuePair={addNewKeyValuePair}
                darkMode={darkMode}
              />
            </Tab.Pane>

            <Tab.Pane eventKey="request" bsPrefix="rest-api-tabpanes" transition={false}>
              <div className="tab-content-wrapper">
                <div>
                  <CodeHinter
                    type="multiline"
                    initialValue={rawMessage || '{\n\n}'}
                    lang="javascript"
                    height={'300px'}
                    className="query-hinter"
                    onChange={(value) => onRawMessageChange(value)}
                    componentName={`${componentName}/request`}
                  />
                </div>
              </div>
            </Tab.Pane>
          </Tab.Content>
        </div>
      </Row>
    </Tab.Container>
  );
};

const TabContent = ({
  options = [],
  onChange,
  componentName,
  removeKeyValuePair,
  tabType,
  addNewKeyValuePair,
  darkMode,
}) => {
  // Check if we have an empty state
  if (options.length === 0) {
    return (
      <div className="tab-content-wrapper">
        <div className="d-flex align-items-center justify-content-center" style={{ height: '100px' }}>
          <button
            onClick={() => addNewKeyValuePair()}
            className="add-params-btn empty-paramlist-btn"
            style={{ background: 'transparent', border: 'none', color: darkMode ? '#D1D5DB' : '#6B7280' }}
          >
            <p className="d-flex m-0">
              <svg width="20" height="20" viewBox="0 0 24 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 4.5C12.5523 4.5 13 4.94772 13 5.5V11.5H19C19.5523 11.5 20 11.9477 20 12.5C20 13.0523 19.5523 13.5 19 13.5H13V19.5C13 20.0523 12.5523 20.5 12 20.5C11.4477 20.5 11 20.0523 11 19.5V13.5H5C4.44772 13.5 4 13.0523 4 12.5C4 11.9477 4.44772 11.5 5 11.5H11V5.5C11 4.94772 11.4477 4.5 12 4.5Z"
                />
              </svg>
              <span className="ms-2">Add metadata</span>
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content-wrapper">
      {options?.map((option, index) => {
        return (
          <div className="row-container query-manager-border-color" key={index}>
            <div className="fields-container mb-1 restapi-key-value">
              <div className="field col-4 rounded-start rest-api-codehinter-key-field">
                <CodeHinter
                  type="basic"
                  initialValue={option[0]}
                  placeholder="Key"
                  onChange={(value) => onChange('key', index, value)}
                  componentName={`${componentName}/${tabType}::key::${index}`}
                />
              </div>
              <div className="field col rest-api-options-codehinter" style={{ width: '200px' }}>
                <CodeHinter
                  type="basic"
                  initialValue={option[1]}
                  placeholder="Value"
                  onChange={(value) => onChange('value', index, value)}
                  componentName={`${componentName}/${tabType}::value::${index}`}
                />
              </div>
              <button
                className={`d-flex justify-content-center align-items-center delete-field-option bg-transparent border-0 rounded-0 border-top border-bottom border-end rounded-end qm-delete-btn ${darkMode ? 'delete-field-option-dark' : ''
                  }`}
                role="button"
                onClick={() => {
                  removeKeyValuePair(index);
                }}
              >
                <Trash fill="var(--slate9)" style={{ height: '16px' }} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BaseUrl = ({ dataSourceURL, theme }) => {
  return (
    <span
      className={cx('col-6 grpcv2-base-url', {
        'grpcv2-base-url--default': theme === 'default',
        'grpcv2-base-url--dark': theme !== 'default'
      })}
      htmlFor=""
    >
      {dataSourceURL}
    </span>
  );
};

GRPCv2Component.ServerUrl = BaseUrl;
GRPCv2Component.Tabs = ControlledTabs;
GRPCv2Component.TabContent = TabContent;

export default GRPCv2Component;