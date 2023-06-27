import React, { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, Col, Form, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';
import PlusRectangle from '@/_ui/Icon/solidIcons/PlusRectangle';
import Remove from '@/_ui/Icon/bulkIcons/Remove';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

const ArgumentFormPopup = ({
  darkMode,
  onSubmit,
  isEdit,
  name: _name,
  defaultValue: _defaultValue,
  onRemove,
  currentState,
}) => {
  const [showModal, setShowModal] = useState(false);
  const closeMenu = () => setShowModal(false);
  const [name, setName] = useState();
  const [defaultValue, setDefaultValue] = useState();

  useEffect(() => {
    setName(_name);
    setDefaultValue(_defaultValue);
  }, [_name, _defaultValue, showModal]);

  useEffect(() => {
    const getParents = (el) => {
      for (var parents = []; el; el = el.parentNode) {
        console.log('el', el, el.parentNode);
        parents.push(el);
      }

      return parents;
    };

    const handleClickOutside = (event) => {
      console.log(event.target, event.target.closest('#page-handler-menu'));
      console.log(
        'Parents-->',
        getParents(event.target)
          .reverse()
          .map((e) => e.nodeName)
      );
      if (
        showModal &&
        event.target.closest('#page-handler-menu') === null &&
        event.target.closest('.query_argument_input') === null
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleSubmit = (event) => {
    console.log(event);
    event.preventDefault();
    onSubmit && onSubmit({ name, defaultValue });
    setShowModal(false);
  };

  return (
    <OverlayTrigger
      trigger={'click'}
      placement={'bottom-end'}
      rootClose={true}
      show={showModal}
      overlay={
        <Popover
          id="page-handler-menu"
          className={`query-manager-sort-filter-popup ${darkMode && 'popover-dark-themed'}`}
          style={{ width: '268px' }}
        >
          <Popover.Header style={{ fontSize: '12px' }}>
            {isEdit ? 'UPDATE ARGUMENT' : 'ADD NEW ARGUMENT'}
          </Popover.Header>
          <Popover.Body key={'1'} bsPrefix="popover-body" className="px-0">
            <Form className="container px-3 pb-3" onSubmit={handleSubmit}>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column htmlFor="argName">
                  Name
                </Form.Label>
                <Col sm="9">
                  <Form.Control
                    type="text"
                    aria-describedby="argName"
                    onChange={(event) => setName(event.target.value)}
                    value={name}
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column htmlFor="default">
                  Default Value
                </Form.Label>
                <Col sm="9">
                  <CodeHinter
                    onChange={(value) => setDefaultValue(value)}
                    theme={darkMode ? 'monokai' : 'default'}
                    currentState={currentState}
                    // className="query_argument_input"
                    usePortalEditor={false}
                  />
                  {/* <Form.Control
										type="text"
										aria-describedby="default"
										id="defaultValue"
										onChange={(event) => setDefaultValue(event.target.value)}
										value={defaultValue}
									/> */}
                  <Form.Text id="defaultValue" muted>
                    Expression resolved once on save.
                  </Form.Text>
                </Col>
              </Form.Group>
              <Button type="submit" className="w-100" disabled={!name}>
                Save
              </Button>
            </Form>
          </Popover.Body>
        </Popover>
      }
    >
      <span>
        {isEdit ? (
          <PillButton name={_name} onClick={() => setShowModal(true)} onRemove={onRemove} />
        ) : (
          <Button
            variant="link"
            onClick={() => setShowModal(true)}
            className="border-0 ms-2"
            size="sm"
            style={{ textDecoration: 'none' }}
          >
            <span className="me-1">
              <PlusRectangle fill={'#3E63DD'} width={15} />
            </span>
            Add
          </Button>
        )}
      </span>
    </OverlayTrigger>
  );
};

const PillButton = ({ name, onClick, onRemove }) => (
  <ButtonGroup aria-label="Argument Badge">
    <Button
      size="sm"
      className="custom-bg-secondary custom-text-dark"
      onClick={onClick}
      style={{
        borderTopLeftRadius: '15px',
        borderBottomLeftRadius: '15px',
        textTransform: 'none',
        padding: '0.8rem',
        fontWeight: 500,
      }}
    >
      {name}
    </Button>
    <Button
      onClick={onRemove}
      size="sm"
      className="custom-bg-secondary custom-text-dark"
      style={{
        borderTopRightRadius: '15px',
        borderBottomRightRadius: '15px',
        paddingLeft: 0,
        paddingRight: '0.75rem',
      }}
    >
      <Remove fill="#000000" />
    </Button>
  </ButtonGroup>
);

export default ArgumentFormPopup;
