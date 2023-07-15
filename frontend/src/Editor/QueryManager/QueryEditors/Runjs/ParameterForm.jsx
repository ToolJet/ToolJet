import React, { useEffect, useState } from 'react';
import { Form, Popover, Row, Col } from 'react-bootstrap';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';

const isValidVariableName = (str) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);

const ParameterForm = ({
  darkMode,
  isEdit,
  name: _name,
  defaultValue: _defaultValue,
  onSubmit,
  currentState,
  showModal,
  otherParams = [],
}) => {
  const [name, setName] = useState();
  const [defaultValue, setDefaultValue] = useState();
  const [error, setError] = useState();

  useEffect(() => {
    setName(_name);
    setDefaultValue(_defaultValue);
  }, [_name, _defaultValue, showModal]);

  useEffect(() => {
    if (!showModal) {
      onSubmit && onSubmit({ name, defaultValue });
    }
  }, [showModal]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit && onSubmit({ name, defaultValue });
  };

  useEffect(() => {
    console.log(otherParams, name);
    if (!isValidVariableName(name)) {
      setError('Variable name invalid');
    } else if (name && otherParams.some((param) => param.name === name.trim())) {
      setError('Variable name exists');
    } else {
      setError();
    }
  }, [name]);

  return (
    <>
      <Popover.Header style={{ fontSize: '12px' }}>{isEdit ? 'UPDATE PARAMETER' : 'ADD PARAMETER'}</Popover.Header>
      <Popover.Body key={'1'} bsPrefix="popover-body" className="px-0">
        <Form className="container px-3" onSubmit={handleSubmit}>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column htmlFor="paramName">
              Name
            </Form.Label>
            <Col sm="9">
              <Form.Control
                type="text"
                aria-describedby="paramName"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
              {name && error && <div className="invalid-feedback d-block">{error}</div>}
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Label column htmlFor="defaultValue">
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
          {/* <Button type="submit" className="w-100" disabled={!name || error}>
            Save
          </Button> */}
        </Form>
      </Popover.Body>
    </>
  );
};

export default ParameterForm;
