import React, { useEffect, useState } from 'react';
import { Button, Form, Popover, Row, Col } from 'react-bootstrap';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';

const isValidVariableName = (str) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);

const ArgumentForm = ({
  darkMode,
  isEdit,
  name: _name,
  defaultValue: _defaultValue,
  onSubmit,
  currentState,
  showModal,
  otherArgs = [],
}) => {
  const [name, setName] = useState();
  const [defaultValue, setDefaultValue] = useState();
  const [error, setError] = useState();

  useEffect(() => {
    setName(_name);
    setDefaultValue(_defaultValue);
  }, [_name, _defaultValue, showModal]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit && onSubmit({ name, defaultValue });
  };

  useEffect(() => {
    console.log(otherArgs, name);
    if (!isValidVariableName(name)) {
      setError('Variable name invalid');
    } else if (name && otherArgs.some((a) => a.name === name.trim())) {
      setError('Variable name exists');
    } else {
      setError();
    }
  }, [name]);

  // eslint-disable-next-line no-undef

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
              {name && error && <div class="invalid-feedback d-block">{error}</div>}
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
              />
            </Col>
          </Form.Group>
          <Button type="submit" className="w-100" disabled={!name || error}>
            Save
          </Button>
        </Form>
      </Popover.Body>
    </>
  );
};

export default ArgumentForm;
