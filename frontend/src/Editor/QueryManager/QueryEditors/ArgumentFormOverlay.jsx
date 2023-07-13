import React, { useEffect, useState } from 'react';
import { Button, Form, OverlayTrigger, Popover, Row, Col } from 'react-bootstrap';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

const ArgumentFormOverlay = ({
  darkMode,
  isEdit,
  name: _name,
  defaultValue: _defaultValue,
  onSubmit,
  currentState,
  showModal,
}) => {
  const [name, setName] = useState();
  const [defaultValue, setDefaultValue] = useState();

  useEffect(() => {
    setName(_name);
    setDefaultValue(_defaultValue);
  }, [_name, _defaultValue, showModal]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit && onSubmit({ name, defaultValue });
  };

  return (
    <>
      <Popover.Header style={{ fontSize: '12px' }}>{isEdit ? 'UPDATE ARGUMENT' : 'ADD NEW ARGUMENT'}</Popover.Header>
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
                usePortalEditor={false}
                height={36}
                initialValue={defaultValue}
                // enablePreview={false}
              />
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
    </>
  );
};

export default ArgumentFormOverlay;
