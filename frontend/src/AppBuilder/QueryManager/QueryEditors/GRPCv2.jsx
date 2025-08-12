import React from 'react';
import { Tab, ListGroup, Row } from 'react-bootstrap';
import cx from 'classnames';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';
import ArrowUpDown from '@/_ui/Icon/solidIcons/ArrowUpDown';
import './grpcv2.scss';

const HierarchicalDropdown = ({ options, value, onChange, placeholder, disabled }) => {
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
    <div ref={dropdownRef} className="grpcv2-dropdown">
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
          {options.map((service) => (
            <div key={service.value}>
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
                  onClick={() => selectMethod(method)}
                  title={method.disabled ? "Streaming methods are not supported" : ""}
                  className={cx('grpcv2-dropdown__method', {
                    'grpcv2-dropdown__method--disabled': method.disabled,
                    'grpcv2-dropdown__method--selected': method.value === value
                  })}
                >
                  <ArrowUpDown
                    width="20"
                    fill={method.isStreaming ? "#889096" : "#4368e3"}
                  />
                  <span className="grpcv2-dropdown__method__name">{method.label}</span>
                </div>
              ))}
            </div>
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
  const [metaDataOptions, setMetaDataOptions] = React.useState(() => {
    if (options?.metaDataOptions) {
      return JSON.parse(options?.metaDataOptions);
    }
    return [['', '']];
  });

  React.useEffect(() => {
    if (options?.jsonMessage && !options?.requestData) {
      handleRequestDataChanged(options.jsonMessage);
    }
  }, []);

  // Handle query switching - reset state when switching to a different query
  React.useEffect(() => {
    // Update metaDataOptions when options change
    if (options?.metaDataOptions) {
      try {
        const newMetaDataOptions = JSON.parse(options.metaDataOptions);
        setMetaDataOptions(newMetaDataOptions);
      } catch (error) {
        console.warn('Invalid metaDataOptions JSON:', error);
        setMetaDataOptions([['', '']]);
      }
    } else {
      setMetaDataOptions([['', '']]);
    }
  }, [options?.metaDataOptions, queryName]);

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
    const currentMetaDataOptions = [...metaDataOptions];
    currentMetaDataOptions.push(['', '']);
    setMetaDataOptions(currentMetaDataOptions);
  };

  const removeMetadata = (index) => {
    const currentMetaDataOptions = [...metaDataOptions];
    currentMetaDataOptions.splice(index, 1);
    setMetaDataOptions(currentMetaDataOptions);
  };

  const updateMetadata = (type, index, value) => {
    const currentMetaDataOptions = [...metaDataOptions];
    currentMetaDataOptions[index][type === 'key' ? 0 : 1] = value;

    setMetaDataOptions(currentMetaDataOptions);
    optionsChanged({
      ...options,
      metaDataOptions: JSON.stringify(currentMetaDataOptions),
    });
  };

  const handleRequestDataChanged = (value) => {
    const updatedOptions = {
      ...options,
      requestData: value,
    };

    try {
      if (value && value.trim()) {
        updatedOptions.request = JSON.parse(value);
      } else {
        updatedOptions.request = {};
      }
    } catch (error) {
      console.warn('Invalid JSON in request data:', error.message);
    }

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
            <div className="grpcv2-server-url">
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
              />
            </div>
          </div>
        </div>
      </div>

      <div className={cx('query-pane-restapi-tabs', { dark: darkMode })}>
        <GRPCv2Component.Tabs
          theme={darkMode ? 'monokai' : 'default'}
          metaDataoptions={metaDataOptions}
          onChange={updateMetadata}
          onRequestDataChange={handleRequestDataChanged}
          removeKeyValuePair={removeMetadata}
          addNewKeyValuePair={addMetadata}
          darkMode={darkMode}
          componentName={queryName}
          requestData={options?.requestData || options?.jsonMessage || '{\n\n}'}
        />
      </div>
    </div>
  );
};

const ControlledTabs = ({
  metaDataoptions,
  theme,
  onChange,
  onRequestDataChange,
  removeKeyValuePair,
  addNewKeyValuePair,
  darkMode,
  componentName,
  requestData,
}) => {
  const [key, setKey] = React.useState('request');
  const tabs = ['Request', 'Metadata'];

  return (
    <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="request">
      <Row>
        <div className="keys">
          <ListGroup className="query-pane-rest-api-keys-list-group mx-1" variant="flush">
            {tabs.map((tab) => (
              <ListGroup.Item key={tab} eventKey={tab.toLowerCase()}>
                <span>{tab}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>

        <div className={cx('col', { 'theme-dark': darkMode })}>
          <Tab.Content
            bsPrefix="rest-api-tab-content"
            className="border overflow-hidden query-manager-border-color rounded"
          >
            <Tab.Pane eventKey="metadata" bsPrefix="rest-api-tabpanes" transition={false}>
              <GRPCv2Component.TabContent
                options={metaDataoptions}
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
                    initialValue={requestData || '{\n\n}'}
                    lang="javascript"
                    height={'300px'}
                    className="query-hinter"
                    onChange={(value) => onRequestDataChange(value)}
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
  return (
    <div className="tab-content-wrapper">
      {options?.map((option, index) => {
        return (
          <div className="row-container border-bottom query-manager-border-color" key={index}>
            <div className="fields-container ">
              <div className="d-flex justify-content-center align-items-center query-number">{index + 1}</div>
              <div className="field col-4 overflow-hidden">
                <CodeHinter
                  type="basic"
                  initialValue={option[0]}
                  placeholder="Key"
                  onChange={(value) => onChange('key', index, value)}
                  componentName={`${componentName}/${tabType}::key::${index}`}
                />
              </div>
              <div className="field col overflow-hidden">
                <CodeHinter
                  type="basic"
                  initialValue={option[1]}
                  placeholder="Value"
                  onChange={(value) => onChange('value', index, value)}
                  componentName={`${componentName}/${tabType}::value::${index}`}
                />
              </div>
              <div
                className="d-flex justify-content-center align-items-center delete-field-option"
                role="button"
                onClick={() => {
                  removeKeyValuePair(index);
                }}
              >
                <span className="rest-api-delete-field-option query-icon-wrapper d-flex">
                  <svg width="100%" height="100%" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5.58579 0.585786C5.96086 0.210714 6.46957 0 7 0H11C11.5304 0 12.0391 0.210714 12.4142 0.585786C12.7893 0.960859 13 1.46957 13 2V4H15.9883C15.9953 3.99993 16.0024 3.99993 16.0095 4H17C17.5523 4 18 4.44772 18 5C18 5.55228 17.5523 6 17 6H16.9201L15.9997 17.0458C15.9878 17.8249 15.6731 18.5695 15.1213 19.1213C14.5587 19.6839 13.7957 20 13 20H5C4.20435 20 3.44129 19.6839 2.87868 19.1213C2.32687 18.5695 2.01223 17.8249 2.00035 17.0458L1.07987 6H1C0.447715 6 0 5.55228 0 5C0 4.44772 0.447715 4 1 4H1.99054C1.9976 3.99993 2.00466 3.99993 2.0117 4H5V2C5 1.46957 5.21071 0.960859 5.58579 0.585786ZM3.0868 6L3.99655 16.917C3.99885 16.9446 4 16.9723 4 17C4 17.2652 4.10536 17.5196 4.29289 17.7071C4.48043 17.8946 4.73478 18 5 18H13C13.2652 18 13.5196 17.8946 13.7071 17.7071C13.8946 17.5196 14 17.2652 14 17C14 16.9723 14.0012 16.9446 14.0035 16.917L14.9132 6H3.0868ZM11 4H7V2H11V4ZM6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289C6.68342 8.90237 7.31658 8.90237 7.70711 9.29289L9 10.5858L10.2929 9.29289C10.6834 8.90237 11.3166 8.90237 11.7071 9.29289C12.0976 9.68342 12.0976 10.3166 11.7071 10.7071L10.4142 12L11.7071 13.2929C12.0976 13.6834 12.0976 14.3166 11.7071 14.7071C11.3166 15.0976 10.6834 15.0976 10.2929 14.7071L9 13.4142L7.70711 14.7071C7.31658 15.0976 6.68342 15.0976 6.29289 14.7071C5.90237 14.3166 5.90237 13.6834 6.29289 13.2929L7.58579 12L6.29289 10.7071Z"
                      fill="#DB4324"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="d-flex" style={{ maxHeight: '32px' }}>
        <div
          className={cx('d-flex align-items-center justify-content-center add-tabs grpcv2-add-button', {
            'grpcv2-add-button--dark': darkMode
          })}
          onClick={() => addNewKeyValuePair()}
          role="button"
        >
          <span className="rest-api-add-field-svg">
            <svg width="100%" height="100%" viewBox="0 0 24 25" fill="#5677E1" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 4.5C12.5523 4.5 13 4.94772 13 5.5V11.5H19C19.5523 11.5 20 11.9477 20 12.5C20 13.0523 19.5523 13.5 19 13.5H13V19.5C13 20.0523 12.5523 20.5 12 20.5C11.4477 20.5 11 20.0523 11 19.5V13.5H5C4.44772 13.5 4 13.0523 4 12.5C4 11.9477 4.44772 11.5 5 11.5H11V5.5C11 4.94772 11.4477 4.5 12 4.5Z"
                fill="#3E63DD"
              />
            </svg>
          </span>
        </div>
        <div
          className="col"
          style={{
            flex: '1',
            background: darkMode ? '' : '#ffffff'
          }}
        ></div>
      </div>
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