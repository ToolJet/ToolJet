import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/Editor/CodeEditor/utils';
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
  currentColumnType = '',
}) => {
  column = typeof column === 'object' && column !== null ? column : { label: column, value: column };
  const isJSonTypeColumn = currentColumnType === 'jsonb';
  return (
    <div className="" key={id}>
      <Container fluid className="p-0">
        <Row className="mx-0">
          <Col sm="4" className="p-0">
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
          <Col sm="8" className="p-0 d-flex tjdb-codhinter-wrapper">
            <CodeHinter
              type="basic"
              initialValue={value ? (typeof value === 'string' ? value : JSON.stringify(value)) : value}
              className="codehinter-plugins"
              placeholder="key"
              onChange={(newValue) => {
                if (isJSonTypeColumn) {
                  const [_, __, resolvedValue] = resolveReferences(`{{${newValue}}}`);
                  handleValueChange(resolvedValue);
                } else {
                  handleValueChange(newValue);
                }
              }}
              {...(isJSonTypeColumn && { lang: 'javascript' })}
            />
            <ButtonSolid
              size="sm"
              variant="ghostBlack"
              className="px-1 rounded-0 border rounded-end qm-delete-btn"
              onClick={() => removeColumnOptionsPair(id)}
            >
              <Trash fill="var(--slate9)" style={{ height: '16px' }} />
            </ButtonSolid>
          </Col>
        </Row>
        {isJSonTypeColumn && <span>Use SQL mode to update values in nested JSON field </span>}
      </Container>
    </div>
  );
};
export default RenderColumnUI;
