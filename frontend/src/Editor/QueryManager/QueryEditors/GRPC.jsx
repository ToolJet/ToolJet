import React from 'react';
import Select from '@/_ui/Select';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';
import { Tab, ListGroup, Row } from 'react-bootstrap';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

const GRPCComponent = ({ darkMode, selectedDataSource, ...restProps }) => {
  const protobufDefintion = JSON.parse(selectedDataSource?.options?.protobuf?.value);

  const { options, optionsChanged, queryName } = restProps;

  const serverUrl = selectedDataSource?.options?.url?.value;

  const [serviceNames, setServiceNames] = React.useState([]);
  const [selectedServiceName, setSelectedServiceName] = React.useState({
    label: options?.serviceName ?? '',
    value: options?.serviceName ?? '',
  });
  const [rpc, setRpc] = React.useState(options.rpc ?? '');
  const [metaDataOptions, setMetaDataOptions] = React.useState(() => {
    if (options?.metaDataOptions) {
      return JSON.parse(options?.metaDataOptions);
    }
    return [];
  });

  React.useEffect(() => {
    if (protobufDefintion) {
      const serviceNamesFromDef = Object.keys(protobufDefintion).map((serviceName) => ({
        label: serviceName,
        value: serviceName,
        rpcs: protobufDefintion[serviceName]?.map((rpc) => ({ label: rpc, value: rpc })),
      }));
      setServiceNames(serviceNamesFromDef);

      setSelectedServiceName(serviceNamesFromDef[0]);

      optionsChanged({
        ...options,
        serviceName: serviceNamesFromDef[0].value,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addNewMetaDataKeyValuePair = () => {
    const currentMetaDataOptions = JSON.parse(JSON.stringify(metaDataOptions));
    currentMetaDataOptions.push({ key: '', value: '' });
    setMetaDataOptions(currentMetaDataOptions);
  };

  const removeMetaDataKeyValuePair = (index) => {
    const currentMetaDataOptions = JSON.parse(JSON.stringify(metaDataOptions));
    currentMetaDataOptions.splice(index, 1);
    setMetaDataOptions(currentMetaDataOptions);
  };

  const handleOnMetaDataKeyChange = (type, index, value) => {
    const currentMetaDataOptions = JSON.parse(JSON.stringify(metaDataOptions));
    currentMetaDataOptions[index][type === 'key' ? 0 : 1] = value;

    setMetaDataOptions(currentMetaDataOptions);
    optionsChanged({
      ...options,
      metaDataOptions: JSON.stringify(currentMetaDataOptions),
    });
  };

  const handleJsonBodyChanged = (value) => {
    optionsChanged({
      ...options,
      jsonMessage: value,
    });
  };

  const customSelectStyles = (darkMode, width) => {
    return {
      ...queryManagerSelectComponentStyle(darkMode, width),
      control: (provided) => ({
        ...provided,
        boxShadow: 'none',
        backgroundColor: darkMode ? '#2b3547' : '#F1F3F5',
        borderRadius: '0px',
        borderLeft: 'none',
        height: 32,
        minHeight: 32,
        borderColor: darkMode ? 'inherit' : ' #D7DBDF',
        borderWidth: '1px',
        '&:hover': {
          backgroundColor: darkMode ? '' : '#F8F9FA',
        },
        '&:active': {
          backgroundColor: darkMode ? '' : '#F8FAFF',
          borderColor: '#3E63DD',
          boxShadow: '0px 0px 0px 2px #C6D4F9 ',
        },
        cursor: 'pointer',
      }),
    };
  };

  return (
    <div>
      <div className="rest-api-methods-select-element-container">
        <div className={`col field w-100 d-flex rest-methods-url ${darkMode && 'dark'}`}>
          <GRPCComponent.ServerUrl theme={darkMode ? 'monokai' : 'default'} dataSourceURL={serverUrl} />
          <div className="col-6 d-flex">
            <div className={`${darkMode && 'dark'}`} style={{ width: '200px', height: '32px' }}>
              <Select
                options={serviceNames}
                onChange={(value) => {
                  const selectedService = serviceNames.find((service) => service.value === value);
                  setSelectedServiceName(selectedService);
                  optionsChanged({
                    ...options,
                    serviceName: selectedService.value,
                  });
                }}
                value={selectedServiceName}
                placeholder="Select Service"
                height={32}
                styles={customSelectStyles(darkMode, 200)}
                useCustomStyles={true}
              />
            </div>
            <div className={`${darkMode && 'dark'}`} style={{ width: '180px', height: '32px' }}>
              <Select
                options={selectedServiceName?.rpcs || []}
                onChange={(value) => {
                  setRpc(value);
                  optionsChanged({
                    ...options,
                    rpc: value,
                  });
                }}
                value={rpc}
                placeholder="Select a RPC"
                height={32}
                styles={customSelectStyles(darkMode, 170)}
                useCustomStyles={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`query-pane-restapi-tabs  ${darkMode ? 'dark' : ''}`}>
        <GRPCComponent.Tabs
          theme={darkMode ? 'monokai' : 'default'}
          metaDataoptions={metaDataOptions}
          currentState={restProps.currentState}
          onChange={handleOnMetaDataKeyChange}
          onJsonBodyChange={handleJsonBodyChanged}
          removeKeyValuePair={removeMetaDataKeyValuePair}
          addNewKeyValuePair={addNewMetaDataKeyValuePair}
          darkMode={darkMode}
          componentName={queryName}
          messageJSON={options?.jsonMessage}
        />
      </div>
    </div>
  );
};

function ControlledTabs({
  metaDataoptions,
  currentState,
  theme,
  onChange,
  onJsonBodyChange,
  removeKeyValuePair,
  addNewKeyValuePair,
  darkMode,
  componentName,
  messageJSON,
}) {
  const [key, setKey] = React.useState('message');
  const tabs = ['Message', 'Metadata'];

  return (
    <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="message">
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
            <Tab.Pane eventKey="metadata" t bsPrefix="rest-api-tabpanes" transition={false}>
              <GRPCComponent.TabContent
                options={metaDataoptions}
                currentState={currentState}
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

            <Tab.Pane eventKey="message" bsPrefix="rest-api-tabpanes" transition={false}>
              <div className="tab-content-wrapper">
                <div>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={messageJSON || '{\n\n}'}
                    mode="javascript"
                    theme={darkMode ? 'monokai' : 'base16-light'}
                    height={'300px'}
                    className="query-hinter"
                    ignoreBraces={false}
                    onChange={(value) => onJsonBodyChange(value)}
                    componentName={`${componentName}/message`}
                    enablePreview={false}
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
  currentState,
  theme,
  onChange,
  componentName,
  removeKeyValuePair,
  paramType,
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
                  currentState={currentState}
                  initialValue={option[0]}
                  theme={theme}
                  height={'32px'}
                  placeholder="Key"
                  onChange={(value) => onChange('key', index, value)}
                  componentName={`${componentName}/${tabType}::key::${index}`}
                />
              </div>
              <div className="field col overflow-hidden">
                <CodeHinter
                  currentState={currentState}
                  initialValue={option[1]}
                  theme={theme}
                  height={'32px'}
                  placeholder="Value"
                  onChange={(value) => onChange('value', index, value)}
                  componentName={`${componentName}/${tabType}::value::${index}`}
                />
              </div>
              <div
                className="d-flex justify-content-center align-items-center delete-field-option"
                role="button"
                onClick={() => {
                  removeKeyValuePair(paramType, index);
                }}
              >
                <span className="rest-api-delete-field-option query-icon-wrapper d-flex">
                  <svg width="auto" height="auto" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          onClick={() => addNewKeyValuePair(paramType)}
          role="button"
        >
          <span className="rest-api-add-field-svg">
            <svg width="auto" height="auto" viewBox="0 0 24 25" fill="#5677E1" xmlns="http://www.w3.org/2000/svg">
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

GRPCComponent.ServerUrl = BaseUrl;
GRPCComponent.Tabs = ControlledTabs;
GRPCComponent.TabContent = TabContent;

export default GRPCComponent;
