import React, { useContext } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import DropDownSelect from './DropDownSelect';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import { isEmpty } from 'lodash';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export default function JoinSort({ darkMode }) {
  const { tableInfo, joinOrderByOptions, setJoinOrderByOptions, findTableDetailsByName } =
    useContext(TooljetDatabaseContext);

  let tableList = [];
  Object.entries(tableInfo).forEach(([key, value]) => {
    const tableDetail = findTableDetailsByName(key);
    if (tableDetail && tableDetail?.table_name) {
      const tableDetails = {
        label: tableDetail.table_name,
        value: tableDetail.table_id,
        options: value.map((columns) => ({
          label: columns.Header,
          value: columns.Header + '_' + tableDetail.table_id,
          table: tableDetail.table_id,
        })),
      };
      tableList.push(tableDetails);
    }
  });

  const sortbyConstants = [
    { label: 'Ascending', value: 'ASC' },
    { label: 'Descending', value: 'DESC' },
  ];

  return (
    <Container fluid className="p-0">
      {isEmpty(joinOrderByOptions) ? (
        <Row className="mb-2 mx-0">
          <div
            style={{
              gap: '4px',
              height: '30px',
              border: '1px dashed var(--slate-08, #C1C8CD)',
            }}
            className="px-4 py-2 text-center rounded-1"
          >
            <SolidIcon name="information" style={{ height: 14, width: 14 }} width={14} height={14} /> There are no
            conditions
          </div>
        </Row>
      ) : (
        joinOrderByOptions.map((options, i) => (
          <Row className="border rounded mb-1 mx-0" key={i}>
            <Col sm="6" className="p-0 border-end">
              <DropDownSelect
                options={tableList}
                darkMode={darkMode}
                value={{
                  value: options.columnName + '_' + options.table,
                  label: options.columnName,
                  table: options.table,
                }}
                onChange={(option) => {
                  setJoinOrderByOptions(
                    joinOrderByOptions.map((sortBy, index) => {
                      if (i === index) {
                        return {
                          ...sortBy,
                          columnName: option?.label,
                          table: option.table,
                        };
                      }
                      return sortBy;
                    })
                  );
                }}
              />
            </Col>
            <Col sm="6" className="p-0 d-flex">
              <div className="flex-grow-1 border-end">
                <DropDownSelect
                  options={sortbyConstants}
                  darkMode={darkMode}
                  value={sortbyConstants.find((opt) => opt.value === options.direction)}
                  onChange={(option) => {
                    setJoinOrderByOptions(
                      joinOrderByOptions.map((sortBy, index) => {
                        if (i === index) {
                          return {
                            ...sortBy,
                            direction: option?.value,
                          };
                        }
                        return sortBy;
                      })
                    );
                  }}
                />
              </div>
              <ButtonSolid
                size="sm"
                variant="ghostBlack"
                className="px-1 rounded-0"
                onClick={() => setJoinOrderByOptions(joinOrderByOptions.filter((opt, idx) => idx !== i))}
              >
                <Trash fill="var(--slate9)" style={{ height: '16px' }} />
              </ButtonSolid>
            </Col>
          </Row>
        ))
      )}
      {/* Dynamically render below Row */}
      <Row className="mx-0">
        <Col className="p-0">
          <ButtonSolid variant="ghostBlue" size="sm" onClick={() => setJoinOrderByOptions([...joinOrderByOptions, {}])}>
            <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            &nbsp;&nbsp; Add more
          </ButtonSolid>
        </Col>
      </Row>
    </Container>
  );
}
