import React, { useContext, useEffect, useState } from 'react';
import { computeCoercion, getCurrentNodeType, resolveReferences } from './utils';
import { EditorContext } from '../Context/EditorContextWrapper';
import CodeHinter from '.';
import { copyToClipboard } from '@/_helpers/appUtils';
import { Alert } from '@/_ui/Alert/Alert';
import _, { isEmpty } from 'lodash';
import { handleCircularStructureToJSON, hasCircularDependency } from '@/_helpers/utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import Card from 'react-bootstrap/Card';
// eslint-disable-next-line import/no-unresolved
import { JsonViewer } from '@textea/json-viewer';

export const PreviewBox = ({ currentValue, validationSchema, setErrorStateActive, componentId, setErrorMessage }) => {
  const { variablesExposedForPreview } = useContext(EditorContext);

  const customVariables = variablesExposedForPreview?.[componentId] ?? {};

  const [resolvedValue, setResolvedValue] = useState('');
  const [error, setError] = useState(null);
  const [coersionData, setCoersionData] = useState(null);
  const getPreviewContent = (content, type) => {
    if (!content) return currentValue;
    try {
      switch (type) {
        case 'Object':
        case 'Array':
          return JSON.stringify(content);
        case 'Boolean':
          return content.toString();
        default:
          return content;
      }
    } catch (e) {
      return undefined;
    }
  };

  let previewType = getCurrentNodeType(resolvedValue);
  let previewContent = resolvedValue;

  if (hasCircularDependency(resolvedValue)) {
    previewContent = JSON.stringify(resolvedValue, handleCircularStructureToJSON());
    previewType = typeof previewContent;
  }

  const ifCoersionErrorHasCircularDependency = (value) => {
    if (hasCircularDependency(value)) {
      return JSON.stringify(value, handleCircularStructureToJSON());
    }
    return value;
  };

  const content = getPreviewContent(previewContent, previewType);

  useEffect(() => {
    if (error) {
      setErrorStateActive(true);
      setErrorMessage(error.message);
    } else {
      setErrorStateActive(false);
      setErrorMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    const [valid, _error, newValue, resolvedValue] = resolveReferences(currentValue, validationSchema, customVariables);

    if (!validationSchema || isEmpty(validationSchema)) {
      return setResolvedValue(newValue);
    }

    if (valid) {
      const [coercionPreview, typeAfterCoercion, typeBeforeCoercion] = computeCoercion(resolvedValue, newValue);
      setResolvedValue(resolvedValue);

      setCoersionData({
        coercionPreview,
        typeAfterCoercion,
        typeBeforeCoercion,
      });
      setError(null);
    } else if (!valid && !newValue && !resolvedValue) {
      const err = !error ? `Invalid value for ${validationSchema?.schema?.type}` : `${_error}`;
      setError({ message: err, value: resolvedValue, type: 'Invalid' });
    } else {
      const jsErrorType = _error?.includes('ReferenceError')
        ? 'ReferenceError'
        : _error?.includes('TypeError')
        ? 'TypeError'
        : _error?.includes('SyntaxError')
        ? 'SyntaxError'
        : 'Invalid';

      const errValue = ifCoersionErrorHasCircularDependency(resolvedValue);

      setError({
        message: _error,
        value: jsErrorType === 'Invalid' ? JSON.stringify(errValue) : resolvedValue,
        type: jsErrorType,
      });
      setCoersionData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  return (
    <>
      <PreviewBox.RenderResolvedValue
        error={error}
        currentValue={currentValue}
        previewType={previewType}
        resolvedValue={content}
        coersionData={coersionData}
        withValidation={!isEmpty(validationSchema)}
      />
      <CodeHinter.PopupIcon
        callback={() => copyToClipboard(error ? error?.value : content)}
        icon={'copy'}
        tip={'Copy to clipboard'}
      />
    </>
  );
};

const RenderResolvedValue = ({ error, previewType, resolvedValue, coersionData, withValidation }) => {
  const computeCoersionPreview = (resolvedValue, coersionData) => {
    if (coersionData?.typeBeforeCoercion === coersionData?.typeAfterCoercion) return resolvedValue;

    if (coersionData?.typeBeforeCoercion === 'array') {
      return '[...]' + coersionData?.coercionPreview;
    }

    if (coersionData?.typeBeforeCoercion === 'object') {
      return '{...}' + coersionData?.coercionPreview;
    }

    return resolvedValue + coersionData?.coercionPreview;
  };

  const previewValueType =
    withValidation || (coersionData && coersionData?.typeBeforeCoercion)
      ? `${coersionData?.typeBeforeCoercion} ${
          coersionData?.coercionPreview ? ` → ${coersionData?.typeAfterCoercion}` : ''
        }`
      : previewType;

  const previewContent = !withValidation ? resolvedValue : computeCoersionPreview(resolvedValue, coersionData);

  const cls = error ? 'codehinter-error-banner' : 'codehinter-success-banner';

  return (
    <div className={`d-flex flex-column align-content-between flex-wrap`}>
      <div className="p-2">
        <span className={`badge text-capitalize font-500 ${cls}`}> {error ? error.type : previewValueType}</span>
      </div>

      <PreviewBox.CodeBlock code={error ? error.value : previewContent} />
    </div>
  );
};

const PreviewContainer = ({
  children,
  isFocused,
  enablePreview,
  setCursorInsidePreview,
  isPortalOpen,
  ...restProps
}) => {
  const { validationSchema, isWorkspaceVariable, errorStateActive, previewPlacement } = restProps;

  const [errorMessage, setErrorMessage] = useState('');

  const typeofError = getCurrentNodeType(errorMessage);

  const errorMsg = typeofError === 'Array' ? errorMessage[0] : errorMessage;

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const popover = (
    <Popover
      bsPrefix="codehinter-preview-popover"
      id="popover-basic"
      className={`${darkMode && 'dark-theme'}`}
      style={{
        width: '250px',
        maxWidth: '350px',
        marginRight: 2,
        zIndex: 1400,
      }}
      onMouseEnter={() => setCursorInsidePreview(true)}
      onMouseLeave={() => setCursorInsidePreview(false)}
    >
      <Popover.Body
        style={{
          border: !isEmpty(validationSchema) && '1px solid var(--slate6)',
          padding: isEmpty(validationSchema) && '0px',
          boxShadow: ' 0px 4px 8px 0px #3032331A, 0px 0px 1px 0px #3032330D',
        }}
      >
        <div>
          {errorStateActive && (
            <div className="mb-2">
              <Alert
                svg="tj-info-error"
                cls={`codehinter preview-alert-banner p-2 mb-0 mt-2 bg-red-lt`}
                iconCls="align-items-start"
                data-cy={``}
                imgHeight={18}
                imgWidth={18}
              >
                <div className="d-flex align-items-center">
                  <div className="">{errorMsg !== 'null' ? errorMsg : 'Invalid'}</div>
                </div>
              </Alert>
            </div>
          )}
          {!isEmpty(validationSchema) && (
            <>
              <div className="mb-1">
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    lineHeight: '16px',
                    letterSpacing: '0em',
                    color: '#6A727C',
                  }}
                >
                  Expected
                </span>
              </div>
              <Card className={darkMode && 'bg-slate2'}>
                <Card.Body
                  className="p-1"
                  style={{
                    minHeight: '60px',
                    maxHeight: '100px',
                  }}
                >
                  <div className="d-flex flex-column align-content-between flex-wrap p-0">
                    <div className="p-2">
                      <span
                        className={`badge bg-light-gray font-500 mute-text text-capitalize`}
                        style={{ fontSize: '12px', background: 'var(--interactive-default)' }}
                      >
                        {validationSchema?.schema?.type}
                      </span>
                    </div>

                    <PreviewBox.CodeBlock code={validationSchema?.defaultValue} isExpectValue={true} />
                  </div>
                </Card.Body>
              </Card>
            </>
          )}
        </div>
        <div className={`${!isEmpty(validationSchema) && 'mt-2'}`}>
          {!isEmpty(validationSchema) && (
            <div className={`mb-1`}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  lineHeight: '16px',
                  letterSpacing: '0em',
                  color: '#6A727C',
                }}
              >
                Current
              </span>
            </div>
          )}

          <Card
            className={darkMode && 'bg-slate2'}
            style={{
              borderColor: errorStateActive ? 'var(--tomato8)' : 'var(--slate6)',
            }}
          >
            <Card.Body
              className="p-1 code-hinter-preview-card-body"
              style={{
                minHeight: '60px',
                maxHeight: '240px',
                overflowY: 'auto',
              }}
            >
              <PreviewBox isFocused={isFocused} setErrorMessage={setErrorMessage} {...restProps} />
            </Card.Body>
          </Card>
        </div>
        {isWorkspaceVariable && <CodeHinter.DepericatedAlert text={'Deprecating soon'} />}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      show={enablePreview && isFocused && !isPortalOpen}
      placement={previewPlacement}
      overlay={popover}
    >
      {children}
    </OverlayTrigger>
  );
};

const PreviewCodeBlock = ({ code, isExpectValue = false }) => {
  let preview = code && code.trim ? code?.trim() : `${code}`;

  const shouldTrim = preview.length > 35;
  let showJSONTree = false;

  if (isExpectValue && shouldTrim) {
    preview = preview.substring(0, 35) + '...' + preview.substring(preview.length - 2, preview.length);
  }

  let prettyPrintedJson = preview;

  try {
    prettyPrintedJson = JSON.parse(preview);

    const typeOfValue = typeof prettyPrintedJson;

    if (typeOfValue === 'object' || typeOfValue === 'array') {
      showJSONTree = true;
    } else {
      prettyPrintedJson = preview;
      showJSONTree = false;
    }
  } catch (e) {
    prettyPrintedJson = preview;
    showJSONTree = false;
  }

  if (showJSONTree) {
    const darkMode = localStorage.getItem('darkMode') === 'true';

    return (
      <div className="preview-json">
        <JsonViewer
          value={prettyPrintedJson}
          displayDataTypes={false}
          displaySize={false}
          displayObjectSize={false}
          enableClipboard={false}
          rootName={false}
          theme={darkMode ? 'dark' : 'light'}
          groupArraysAfterLength={500}
        />
      </div>
    );
  }
  return (
    <div className="p-2 pt-0">
      <pre
        className="text-secondary"
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          display: 'block',
          background: 'transparent',
          border: 'none',
          lineHeight: '1.5',
          maxHeight: 'none',
          overflow: 'auto',
          width: '100%',
          fontSize: '12px',
          overflowY: 'auto',
          padding: '0',
          margin: '0',
        }}
      >
        {prettyPrintedJson?.startsWith('{{') && prettyPrintedJson?.endsWith('{{')
          ? prettyPrintedJson?.replace(/{{/g, '').replace(/}}/g, '')
          : prettyPrintedJson}
      </pre>
    </div>
  );
};

PreviewBox.RenderResolvedValue = RenderResolvedValue;
PreviewBox.Container = PreviewContainer;
PreviewBox.CodeBlock = PreviewCodeBlock;
