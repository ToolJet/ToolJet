import CodeHinter from '@/AppBuilder/CodeEditor';
import { ToolTip } from '@/_components';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import DropDownSelect from './DropDownSelect';

const RenderFilterSectionUI = ({
  column,
  displayColumns,
  handleColumnChange,
  darkMode,
  operator,
  operators,
  handleOperatorChange,
  value,
  isOperatorOptions,
  handleValueChange,
  removeFilterConditionPair,
  id,
  isSelectedColumnJsonbType = false,
  handleJsonPathChange,
  jsonpath = '',
}) => {
  column = typeof column === 'object' && column !== null ? column : { label: column, value: column };
  operator = typeof operator === 'object' && operator !== null ? operator : { label: operator, value: operator };
  const valueForDropdown = typeof value === 'object' && value !== null ? value : { label: value, value: value };
  return (
    <div className="">
      <Container fluid className="p-0">
        <Row className="mb-2 mx-0">
          <Col sm="4" className="p-0">
            <DropDownSelect
              useMenuPortal={true}
              placeholder="Select column"
              value={column}
              options={displayColumns}
              onChange={handleColumnChange}
              // width={'auto'}
              buttonClasses={`border  ${
                isSelectedColumnJsonbType ? 'border-top-left-rounded' : 'rounded-start'
              } overflow-hidden`}
              showPlaceHolder
              darkMode={darkMode}
              isMulti={false}
            />
            {isSelectedColumnJsonbType && (
              <div className="tjdb-codehinter-jsonpath">
                <ToolTip
                  message={
                    jsonpath ? jsonpath : 'Access nested JSON fields by using -> for JSON object and ->> for text'
                  }
                  tooltipClassName="tjdb-table-tooltip"
                  placement="top"
                  trigger={['hover', 'focus']}
                  width="160px"
                >
                  <span>
                    <CodeHinter
                      type="basic"
                      initialValue={jsonpath}
                      lang="javascript"
                      onChange={(value) => {
                        handleJsonPathChange(value);
                      }}
                      enablePreview={false}
                      height="30"
                      placeholder="->>key"
                    />
                  </span>
                </ToolTip>
              </div>
            )}
          </Col>

          <Col sm="4" className="p-0">
            <DropDownSelect
              useMenuPortal={true}
              placeholder="Select operation"
              value={operator}
              options={operators}
              onChange={handleOperatorChange}
              // width={'auto'}
              buttonClasses="border border-start-0 border-end-0 overflow-hidden"
              showPlaceHolder
              darkMode={darkMode}
            />
          </Col>

          <Col sm="4" className="p-0 tjdb-codhinter-wrapper d-flex">
            <div style={{ width: 'calc(100% - 35px)' }}>
              {operator === 'is' ? (
                <DropDownSelect
                  useMenuPortal={true}
                  placeholder="Select value"
                  // value={{ label: value, value: value }}
                  value={valueForDropdown}
                  options={isOperatorOptions}
                  onChange={handleValueChange}
                  //   width={'auto'}
                  buttonClasses="border border-end-0 rounded-start overflow-hidden"
                  showPlaceHolder
                  darkMode={darkMode}
                />
              ) : (
                <CodeHinter
                  type="basic"
                  initialValue={value ? (typeof value === 'string' ? value : JSON.stringify(value)) : value}
                  className="codehinter-plugins"
                  placeholder="key"
                  onChange={(newValue) => handleValueChange(newValue)}
                  height="28"
                />
              )}
            </div>
            <ButtonSolid
              size="sm"
              variant="ghostBlack"
              className="px-1 rounded-0 border rounded-end qm-delete-btn"
              onClick={() => removeFilterConditionPair(id)}
            >
              <Trash fill="var(--slate9)" style={{ height: '16px' }} />
            </ButtonSolid>
          </Col>
          {/* <Col sm="content" className="p-0">
            <ButtonSolid
              size="sm"
              variant="ghostBlack"
              className="px-1 rounded-0 border rounded-end"
              customStyles={{
                height: '30px',
              }}
              onClick={() => removeFilterConditionPair(id)}
            >
              <Trash fill="var(--slate9)" style={{ height: '16px' }} />
            </ButtonSolid>
          </Col> */}
        </Row>
      </Container>
    </div>
  );
};
export default RenderFilterSectionUI;
