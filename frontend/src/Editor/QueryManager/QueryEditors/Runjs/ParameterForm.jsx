import React, { useEffect, useRef, useState } from 'react';
import { Form, Popover, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import Information from '@/_ui/Icon/solidIcons/Information';

const isValidVariableName = (str) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);

const ParameterForm = ({
  darkMode,
  isEdit,
  name: _name,
  defaultValue: _defaultValue,
  onSubmit,
  showModal,
  otherParams = [],
}) => {
  const [name, setName] = useState();
  const [defaultValue, setDefaultValue] = useState();
  const [error, setError] = useState();

  /**
   * Storing {} in a ref to make sure its not a object instance whenever component reload.
   * passing currentState={{}} to CodeHinter will consider it as a new value whenver this component rerenders
   */
  const emptyObj = useRef({});

  useEffect(() => {
    setName(_name);
    setDefaultValue(_defaultValue);
  }, [_name, _defaultValue, showModal]);

  useEffect(() => {
    if (!showModal && !error) {
      onSubmit && onSubmit({ name, defaultValue });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!error) {
      onSubmit && onSubmit({ name, defaultValue });
    }
  };

  useEffect(() => {
    if (!isValidVariableName(name)) {
      setError('Variable name invalid');
    } else if (name && otherParams.some((param) => param.name === name.trim())) {
      setError('Variable name exists');
    } else {
      setError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return (
    <>
      <Popover.Header className={darkMode && 'dark-theme'} style={{ fontSize: '12px' }}>
        {isEdit ? 'UPDATE PARAMETER' : 'ADD PARAMETER'}
      </Popover.Header>
      <Popover.Body className={darkMode && 'dark-theme dark-theme'} key={'1'} bsPrefix="popover-body">
        <Form
          className="container p-0 tj-app-input"
          onSubmit={handleSubmit}
          style={{ paddingRight: '25px !important' }}
        >
          <Form.Group as={Row} className="mb-2 pr-1">
            <Form.Label column htmlFor="paramName">
              Name
            </Form.Label>
            <Col sm="12">
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
              <span className="ms-1">
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id="tooltip">
                      Exposed values such as components, queries, globals etc are not supported in this field.Please use
                      constant strings, numbers or objects.
                    </Tooltip>
                  }
                >
                  <span>
                    <Information width="15" fill="var(--indigo9)" />
                  </span>
                </OverlayTrigger>
              </span>
            </Form.Label>
            <Col sm="12">
              <div className="d-flex">
                <div className="w-100">
                  <CodeHinter
                    onChange={(value) => setDefaultValue(value)}
                    theme={darkMode ? 'monokai' : 'default'}
                    currentState={emptyObj.current}
                    usePortalEditor={false}
                    height={36}
                    initialValue={defaultValue}
                    enablePreview={false}
                  />
                </div>
              </div>
            </Col>
          </Form.Group>
        </Form>
      </Popover.Body>
    </>
  );
};

export default ParameterForm;
