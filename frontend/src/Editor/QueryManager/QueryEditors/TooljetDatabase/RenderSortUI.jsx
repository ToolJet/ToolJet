import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import DropDownSelect from './DropDownSelect';

const RenderSortUI = ({
  column,
  displayColumns,
  handleColumnChange,
  darkMode,
  order,
  orders,
  handleDirectionChange,
  removeSortConditionPair,
  id,
}) => {
  column = typeof column === 'object' && column !== null ? column : { label: column, value: column };
  order = typeof order === 'object' && order !== null ? order : { label: order, value: order };

  return (
    <div className="">
      <Container fluid className="p-0 ">
        <Row className="mb-2 mx-0 ">
          <Col sm="6" className="p-0">
            <DropDownSelect
              buttonClasses="border border-end-0 rounded-start overflow-hidden"
              useMenuPortal={true}
              placeholder="Select column"
              value={column}
              options={displayColumns}
              onChange={handleColumnChange}
              showPlaceHolder
              width="auto"
              darkMode={darkMode}
            />
          </Col>
          <Col sm="6" className="p-0 d-flex">
            <div className="flex-grow-1">
              <DropDownSelect
                buttonClasses="border border-end-0 overflow-hidden"
                useMenuPortal={true}
                placeholder="Select direction"
                value={order}
                options={orders}
                onChange={handleDirectionChange}
                showPlaceHolder
                darkMode={darkMode}
                width="auto"
              />
            </div>
            <ButtonSolid
              size="sm"
              variant="ghostBlack"
              className="px-1 rounded-0 border rounded-end"
              customStyles={{
                height: '30px',
              }}
              onClick={() => removeSortConditionPair(id)}
            >
              <Trash fill="var(--slate9)" style={{ height: '16px' }} />
            </ButtonSolid>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
export default RenderSortUI;
