import React from 'react';
import { Tab, ListGroup, Row } from 'react-bootstrap';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { dataqueryService } from '@/_services';
import { toast } from 'react-hot-toast';
import ArrowUpDown from '@/_ui/Icon/solidIcons/ArrowUpDown';

const GRPCv2Component = ({ darkMode, selectedDataSource, ...restProps }) => {
  const { options, optionsChanged, queryName, currentEnvironment } = restProps;
  const serverUrl = selectedDataSource?.options?.url?.value;

  // State management
  const [servicesData, setServicesData] = React.useState({ services: [] });
  const [selectedService, setSelectedService] = React.useState(null);
  const [selectedMethod, setSelectedMethod] = React.useState(null);
  const [isLoadingServices, setIsLoadingServices] = React.useState(false);
  const [metaDataOptions, setMetaDataOptions] = React.useState(() => {
    if (options?.metaDataOptions) {
      return JSON.parse(options?.metaDataOptions);
    }
    return [['', '']];
  });

  // Initialize requestData from existing options for backward compatibility
  React.useEffect(() => {
    if (options?.jsonMessage && !options?.requestData) {
      // Migrate from old jsonMessage to new requestData
      handleRequestDataChanged(options.jsonMessage);
    }
  }, []);

  // Load services and methods from backend
  const loadServicesAndMethods = React.useCallback(async () => {
    if (!selectedDataSource?.id) return;

    // Check if we have a valid URL
    if (!selectedDataSource?.options?.url?.value) {
      toast.error('Please configure the server URL in your data source settings');
      return;
    }

    setIsLoadingServices(true);

    try {
      // Call the grpcv2 plugin method with environment context
      const result = await dataqueryService.invoke(selectedDataSource.id, 'discoverServices', currentEnvironment?.id);
      
      // Handle QueryResult format: { status: 'ok', data: [...] } or { status: 'failed', errorMessage: '...' }
      if (result.status === 'failed') {
        throw new Error(result.errorMessage || 'Failed to discover services');
      }
      
      const servicesArray = Array.isArray(result.data) ? result.data : (result.data || []);
      
      // Prepare restoration state
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
      
      // Batch all state updates together to prevent intermediate render
      setServicesData({ services: servicesArray });
      setSelectedService(restoredService);
      setSelectedMethod(restoredMethod);
    } catch (error) {
      console.error('Failed to load services:', error);
      let errorMessage = 'Failed to load services';

      // Provide more helpful error messages based on the error type
      if (error.message) {
        if (error.message.includes('REFLECTION_NOT_SUPPORTED')) {
          errorMessage = 'Server does not support reflection. Please use proto URL method instead.';
        } else if (error.message.includes('REFLECTION_CONNECTION_FAILED') || error.message.includes('CONNECTION_FAILED') || error.message.includes('UNAVAILABLE')) {
          errorMessage = 'Unable to connect to gRPC server. Please check:\n• URL format should be host:port (e.g., localhost:50051)\n• Remove http:// or https:// prefix\n• Ensure the server is running';
        } else if (error.message.includes('UNAUTHENTICATED')) {
          errorMessage = 'Authentication failed. Please check your credentials.';
        } else if (error.message.includes('NO_SERVICES_FOUND')) {
          errorMessage = 'No services found. The server may not have any exposed services.';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoadingServices(false);
    }
  }, [selectedDataSource?.id, selectedDataSource?.options?.url?.value]);

  // Force immediate loading state when data source changes to prevent stale data
  React.useEffect(() => {
    setIsLoadingServices(true);
    setServicesData({ services: [] });
    setSelectedService(null);
    setSelectedMethod(null);
  }, [selectedDataSource?.id]);

  // Load services on component mount and when data source changes
  React.useEffect(() => {
    loadServicesAndMethods();
  }, [loadServicesAndMethods]);

  // Handle hierarchical selection (service + method combined)
  const handleHierarchicalSelection = (selectedOption) => {
    if (!selectedOption || selectedOption.type !== 'method') {
      // Only allow method selection, not service selection
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

  // Get current selection display value
  const getCurrentSelectionValue = () => {
    if (selectedService && selectedMethod) {
      return `${selectedService.name}:${selectedMethod.name}`;
    }
    return '';
  };

  const getCurrentSelectionLabel = () => {
    if (selectedService && selectedMethod) {
      return `${selectedService.name} → ${selectedMethod.name}`;
    }
    return 'Select service';
  };

  // Metadata handlers (reuse from existing GRPC component)
  const addNewMetaDataKeyValuePair = () => {
    const currentMetaDataOptions = [...metaDataOptions];
    currentMetaDataOptions.push(['', '']);
    setMetaDataOptions(currentMetaDataOptions);
  };

  const removeMetaDataKeyValuePair = (index) => {
    const currentMetaDataOptions = [...metaDataOptions];
    currentMetaDataOptions.splice(index, 1);
    setMetaDataOptions(currentMetaDataOptions);
  };

  const handleOnMetaDataKeyChange = (type, index, value) => {
    const currentMetaDataOptions = [...metaDataOptions];
    currentMetaDataOptions[index][type === 'key' ? 0 : 1] = value;

    setMetaDataOptions(currentMetaDataOptions);
    optionsChanged({
      ...options,
      metaDataOptions: JSON.stringify(currentMetaDataOptions),
    });
  };

  const handleRequestDataChanged = (value) => {
    // Store the raw JSON string for the editor
    const updatedOptions = {
      ...options,
      requestData: value,
    };

    // Parse JSON and add to request field for backend
    try {
      if (value && value.trim()) {
        updatedOptions.request = JSON.parse(value);
      } else {
        updatedOptions.request = {};
      }
    } catch (error) {
      // Keep the raw requestData but don't set request if JSON is invalid
      // Show a warning to the user about invalid JSON
      console.warn('Invalid JSON in request data:', error.message);
      // Don't show toast immediately as user might still be typing
      // The error will be shown when they try to run the query
    }

    optionsChanged(updatedOptions);
  };


  // Prepare hierarchical options for single dropdown
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
        // Put non-streaming methods first
        if (a.disabled && !b.disabled) return 1;
        if (!a.disabled && b.disabled) return -1;
        return a.label.localeCompare(b.label);
      })
  }));


  // Custom Hierarchical Dropdown Component
  const HierarchicalDropdown = ({ options, value, onChange, placeholder, disabled }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    // Initialize with all services expanded by default
    const [expandedServices, setExpandedServices] = React.useState(() =>
      new Set(options.map(service => service.label))
    );

    const dropdownRef = React.useRef(null);

    // Update expanded services when options change (when services are loaded)
    React.useEffect(() => {
      setExpandedServices(new Set(options.map(service => service.label)));
    }, [options]);

    // Close dropdown and reset state when disabled (loading)
    React.useEffect(() => {
      if (disabled) {
        setIsOpen(false);
        setExpandedServices(new Set());
      }
    }, [disabled]);

    // Close dropdown when clicking outside
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

    const handleMethodSelect = (methodOption) => {
      if (methodOption.disabled) return;
      onChange(methodOption);
      // Use setTimeout to prevent immediate re-opening
      setTimeout(() => {
        setIsOpen(false);
      }, 0);
    };

    const getDisplayValue = () => {
      // Show placeholder immediately when disabled (loading)
      if (disabled) return placeholder;
      
      const selectedMethod = options
        .flatMap(service => service.methods)
        .find(method => method.value === value);
      return selectedMethod ? `${selectedMethod.serviceName} → ${selectedMethod.label}` : placeholder;
    };

    return (
      <div ref={dropdownRef} className="hierarchical-dropdown" style={{ position: 'relative', width: '100%' }}>
        {/* Dropdown Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            height: '32px',
            backgroundColor: '#ffffff',
            border: isOpen ? '2px solid #4368e3' : '1px solid #e6e8eb',
            borderRadius: '0 6px 6px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            fontSize: '12px',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontWeight: '400',
            color: '#687076',
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none'
          }}
        >
          <span style={{
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: '20px'
          }}>
            {getDisplayValue()}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="#6a727c"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            minWidth: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #e6e8eb',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: 1000,
            padding: '8px 0'
          }}>
            {options.map((service, index) => (
              <div key={service.value}>
                {/* Service Header - matches Figma design */}
                <div
                  onClick={() => toggleService(service.label)}
                  style={{
                    padding: '12px 10px 4px 10px',
                    fontSize: '12px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontWeight: '500',
                    color: '#687076',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: index > 0 ? '1px solid #e6e8eb' : 'none',
                    marginTop: index > 0 ? '12px' : '0',
                    lineHeight: '20px'
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap' }}>{service.label}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    style={{
                      transform: expandedServices.has(service.label) ? 'rotate(0deg)' : 'rotate(180deg)',
                      transition: 'transform 0.2s'
                    }}
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

                {/* Methods - matches Figma design */}
                {expandedServices.has(service.label) && service.methods.map((method) => (
                  <div
                    key={method.value}
                    onClick={() => handleMethodSelect(method)}
                    title={method.disabled ? "Streaming methods are not supported" : ""}
                    style={{
                      padding: '8px 10px',
                      fontSize: '14px',
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      fontWeight: '400',
                      color: method.disabled ? '#889096' : '#11181c',
                      backgroundColor: method.value === value ? '#f0f4ff' : 'transparent',
                      cursor: method.disabled ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: method.disabled ? 0.6 : 1,
                      textDecoration: method.disabled ? 'line-through' : 'none',
                      lineHeight: '20px',
                      borderRadius: '6px',
                      margin: '2px 0'
                    }}
                    onMouseEnter={(e) => {
                      if (!method.disabled) {
                        e.target.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (method.value !== value) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {/* Method type icon - matches Figma design */}
                    <ArrowUpDown
                      width="20"
                      fill={method.isStreaming ? "#889096" : "#4368e3"}
                    />
                    <span style={{ whiteSpace: 'nowrap' }}>{method.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Request section with hierarchical dropdown - matching Source field structure */}
      <div className="d-flex" style={{ marginBottom: '16px', marginTop: '12px' }}>
        <div className="d-flex query-manager-border-color hr-text-left py-2 form-label font-weight-500">
          Request
        </div>
        <div className="d-flex flex-column align-items-start" style={{ width: '500px' }}>
          <div className="d-flex" style={{ minHeight: '32px', width: '100%' }}>
            {/* Server URL */}
            <div
              style={{
                width: '160px',
                height: '32px',
                backgroundColor: '#ffffff',
                border: '1px solid #e6e8eb',
                borderRadius: '6px 0 0 6px',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '10px',
                paddingRight: '10px'
              }}
            >
              <span style={{
                fontSize: '12px',
                color: '#687076',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontWeight: '400',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {serverUrl || 'localhost:50051'}
              </span>
            </div>

            {/* Hierarchical Service/Method selector */}
            <div className="flex-grow-1">
              <HierarchicalDropdown
                options={hierarchicalOptions}
                value={getCurrentSelectionValue()}
                onChange={handleHierarchicalSelection}
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

      <div className={`query-pane-restapi-tabs  ${darkMode ? 'dark' : ''}`}>
        <GRPCv2Component.Tabs
          theme={darkMode ? 'monokai' : 'default'}
          metaDataoptions={metaDataOptions}
          onChange={handleOnMetaDataKeyChange}
          onRequestDataChange={handleRequestDataChanged}
          removeKeyValuePair={removeMetaDataKeyValuePair}
          addNewKeyValuePair={addNewMetaDataKeyValuePair}
          darkMode={darkMode}
          componentName={queryName}
          requestData={options?.requestData || options?.jsonMessage || '{\n\n}'}
        />
      </div>
    </div>
  );
};

// Reuse tab components from existing GRPC component
function ControlledTabs({
  metaDataoptions,
  theme,
  onChange,
  onRequestDataChange,
  removeKeyValuePair,
  addNewKeyValuePair,
  darkMode,
  componentName,
  requestData,
}) {
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

        <div className={`col ${darkMode && 'theme-dark'}`}>
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
}

const TabContent = ({
  options = [],
  theme, // eslint-disable-line no-unused-vars
  onChange,
  componentName,
  removeKeyValuePair,
  paramType, // eslint-disable-line no-unused-vars
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
          className="d-flex align-items-center justify-content-center add-tabs "
          style={{ flex: '0 0 32px', background: darkMode ? 'inherit' : '#F8F9FA', height: '32px' }}
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
        <div className="col" style={{ flex: '1', background: darkMode ? '' : '#ffffff' }}></div>
      </div>
    </div>
  );
};

export const BaseUrl = ({ dataSourceURL, theme }) => {
  return (
    <span
      className="col-6"
      htmlFor=""
      style={{
        padding: '5px',
        border: theme === 'default' ? '1px solid rgb(217 220 222)' : '1px solid white',
        background: theme === 'default' ? 'rgb(246 247 251)' : '#20211e',
        color: theme === 'default' ? '#9ca1a6' : '#9e9e9e',
        height: '32px',
      }}
    >
      {dataSourceURL}
    </span>
  );
};

GRPCv2Component.ServerUrl = BaseUrl;
GRPCv2Component.Tabs = ControlledTabs;
GRPCv2Component.TabContent = TabContent;

export default GRPCv2Component;