import CodeHinter from '@/AppBuilder/CodeEditor';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import DropDownSelect from './DropDownSelect';

const RenderColumnUI = ({
  column,
  displayColumns,
  handleColumnChange,
  darkMode,
  value,
  handleValueChange,
  removeColumnOptionsPair,
  id,
}) => {
  column = typeof column === 'object' && column !== null ? column : { label: column, value: column };
  return (
    <div className="">
      <Container fluid className="p-0">
        <Row className="mb-2 mx-0">
          <Col sm="6" className="p-0">
            <DropDownSelect
              useMenuPortal={true}
              showPlaceHolder
              placeholder="Select column"
              value={column}
              options={displayColumns}
              onChange={handleColumnChange}
              darkMode={darkMode}
              buttonClasses="border border-end-0 rounded-start overflow-hidden"
            />
          </Col>
          <Col sm="6" className="p-0 d-flex tjdb-codhinter-wrapper">
            <CodeHinter
              type="basic"
              initialValue={value ? (typeof value === 'string' ? value : JSON.stringify(value)) : value}
              className="codehinter-plugins"
              placeholder="key"
              onChange={(newValue) => handleValueChange(newValue)}
            />
            <ButtonSolid
              size="sm"
              variant="ghostBlack"
              className="px-1 rounded-0 border rounded-end"
              customStyles={{
                height: '30px',
              }}
              onClick={() => removeColumnOptionsPair(id)}
            >
              <Trash fill="var(--slate9)" style={{ height: '16px' }} />
            </ButtonSolid>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
export default RenderColumnUI;
