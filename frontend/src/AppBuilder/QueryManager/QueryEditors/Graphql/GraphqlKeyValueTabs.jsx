import React from 'react';
import { Tab, ListGroup, Row } from 'react-bootstrap';
import { Button } from '@/components/ui/Button/Button';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import GraphqlTabContent from './GraphqlTabContent';
import './GraphqlKeyValueTabs.css';

export default function GraphqlKeyValueTabs({ tabs = [], options = {}, optionchanged, componentName }) {
  const [activeKey, setActiveKey] = React.useState(() => tabs[0]?.key ?? '');

  React.useEffect(() => {
    if (tabs.length && !tabs.find((t) => t.key === activeKey)) {
      setActiveKey(tabs[0].key);
    }
  }, [tabs]);

  const getRows = (tabKey) => {
    const raw = options[tabKey];
    return Array.isArray(raw) ? raw : [];
  };

  const addNewKeyValuePair = (tabKey) => {
    optionchanged(tabKey, [...getRows(tabKey), ['', '']]);
  };

  const removeKeyValuePair = (tabKey, index) => {
    const next = deepClone(getRows(tabKey));
    next.splice(index, 1);
    optionchanged(tabKey, next);
  };

  const handleChange = (tabKey, keyIndex, rowIndex) => (value) => {
    const next = deepClone(getRows(tabKey));
    next[rowIndex][keyIndex] = value;
    optionchanged(tabKey, next);
  };

  const handleInputChange = (tabKey, rowIndex) => (value) => {
    const rows = getRows(tabKey);
    if (rows.length > 0 && rows.length - 1 === rowIndex && value) {
      addNewKeyValuePair(tabKey);
    }
  };

  if (!tabs.length) return null;

  return (
    <Tab.Container activeKey={activeKey} onSelect={setActiveKey} defaultActiveKey={tabs[0]?.key}>
      <Row className="tw-ml-0">
        <div className="keys d-flex justify-content-between query-pane-tabs-header graphql-tabs-header">
          <ListGroup className="query-pane-rest-api-keys-list-group mx-1 mb-2" variant="flush">
            {tabs.map(({ label, key }) => (
              <ListGroup.Item key={key} eventKey={key} data-cy={generateCypressDataCy(`graphql-tab-${key}-button`)}>
                <span>{label}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>

          <div className="text-nowrap d-flex align-items-center">
            <Button
              isLucid
              iconOnly
              size="medium"
              variant="ghost"
              leadingIcon="plus"
              id="graphql-param-add-btn"
              data-cy={`graphql-${generateCypressDataCy(activeKey)}-add-button`}
              onClick={() => addNewKeyValuePair(activeKey)}
            />
          </div>
        </div>

        <div className="col tw-pl-0">
          <Tab.Content bsPrefix="graphql-tab-content" className="query-manager-border-color rounded">
            {tabs.map(({ key }) => (
              <Tab.Pane
                key={key}
                eventKey={key}
                bsPrefix="graphql-tabpanes"
                transition={false}
                data-cy={`graphql-tab-${key}-pane`}
              >
                <GraphqlTabContent
                  options={getRows(key)}
                  onChange={handleChange}
                  removeKeyValuePair={removeKeyValuePair}
                  addNewKeyValuePair={addNewKeyValuePair}
                  onInputChange={handleInputChange}
                  componentName={componentName ?? 'graphql'}
                  tabType={key}
                  paramType={key}
                />
              </Tab.Pane>
            ))}
          </Tab.Content>
        </div>
      </Row>
    </Tab.Container>
  );
}
