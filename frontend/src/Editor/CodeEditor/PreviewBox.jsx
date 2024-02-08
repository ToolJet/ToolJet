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

export const PreviewBox = ({
  currentValue,
  validationSchema,
  setErrorStateActive,
  componentId,
  fxActive,
  setErrorMessage,
}) => {
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
    const [valid, _error, newValue, resolvedValue] = resolveReferences(
      currentValue,
      validationSchema,
      customVariables,
      fxActive
    );

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

      setError({
        message: _error,
        value: jsErrorType === 'Invalid' ? JSON.stringify(resolvedValue) : resolvedValue,
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
      <CodeHinter.PopupIcon callback={() => copyToClipboard(content)} icon={'copy'} tip={'Copy to clipboard'} />
    </>
  );
};

const RenderResolvedValue = ({ error, previewType, resolvedValue, coersionData, withValidation }) => {
  const previewValueType =
    withValidation || (coersionData && coersionData?.typeBeforeCoercion)
      ? `${coersionData?.typeBeforeCoercion} ${
          coersionData?.coercionPreview ? ` → ${coersionData?.typeAfterCoercion}` : ''
        }`
      : previewType;

  const previewContent = !withValidation ? resolvedValue : resolvedValue + coersionData?.coercionPreview;

  const cls = error ? 'bg-red-lt' : 'bg-green-lt';

  return (
    <div class={`d-flex flex-column align-content-between flex-wrap`}>
      <div class="p-2">
        <span class={`badge text-capitalize font-500 ${cls}`}> {error ? error.type : previewValueType}</span>
      </div>
      <div class="p-2 pt-0">
        <PreviewBox.CodeBlock code={error ? error.value : previewContent} />
      </div>
    </div>
  );
};

const PreviewContainer = ({ children, isFocused, enablePreview, setCursorInsidePreview, ...restProps }) => {
  const { validationSchema, isWorkspaceVariable, errorStateActive } = restProps;

  const [errorMessage, setErrorMessage] = useState('');

  const typeofError = getCurrentNodeType(errorMessage);

  const errorMsg = typeofError === 'Array' ? errorMessage[0] : errorMessage;

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const popover = (
    <Popover
      bsPrefix="codehinter-preview-popover"
      id="popover-basic"
      className={`${darkMode && 'dark-theme'}`}
      style={{ width: '250px', maxWidth: '350px', marginRight: 10 }}
      onMouseEnter={() => setCursorInsidePreview(true)}
      onMouseLeave={() => setCursorInsidePreview(false)}
    >
      <Popover.Body
        style={{
          border: '1px solid var(--slate6)',
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
                  <div class="">{errorMsg !== 'null' ? errorMsg : 'Invalid'}</div>
                </div>
              </Alert>
            </div>
          )}
          <div className="mb-1">
            <span>Expected</span>
          </div>
          <Card className={darkMode && 'bg-slate2'}>
            <Card.Body
              className="p-1"
              style={{
                minHeight: '60px',
                maxHeight: '100px',
              }}
            >
              <div class="d-flex flex-column align-content-between flex-wrap p-0">
                <div class="p-2">
                  <span class="badge bg-light-gray font-500 mute-text text-capitalize">
                    {validationSchema?.schema?.type}
                  </span>
                </div>
                <div class="p-2 pt-0">
                  <PreviewBox.CodeBlock code={validationSchema?.expectedValue} isExpectValue={true} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="mt-2">
          <div className="mb-1">
            <span>Current</span>
          </div>

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
                maxHeight: '100px',
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
    <OverlayTrigger trigger="click" show={enablePreview && isFocused} placement="left-start" overlay={popover}>
      {children}
    </OverlayTrigger>
  );
};

const PreviewCodeBlock = ({ code, isExpectValue = false }) => {
  let preview = code && code.trim ? code?.trim() : `${code}`;
  const shouldTrim = preview.length > 10;

  if (isExpectValue && shouldTrim) {
    preview = preview.substring(0, 10) + '...' + preview.substring(preview.length - 2, preview.length);
  }

  let prettyPrintedJson = null;

  try {
    prettyPrintedJson = JSON.stringify(JSON.parse(preview), null, 2);
  } catch (e) {
    prettyPrintedJson = preview;
  }

  return (
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
      }}
    >
      {prettyPrintedJson}
    </pre>
  );
};

PreviewBox.RenderResolvedValue = RenderResolvedValue;
PreviewBox.Container = PreviewContainer;
PreviewBox.CodeBlock = PreviewCodeBlock;
