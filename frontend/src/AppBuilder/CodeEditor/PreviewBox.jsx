import React, { useEffect, useState } from 'react';
import { computeCoercion, getCurrentNodeType, hasDeepChildren, resolveReferences } from './utils';
import CodeHinter from '.';
import { copyToClipboard } from '@/_helpers/appUtils';
import { Alert } from '@/_ui/Alert/Alert';
import { Button } from '@/components/ui/Button/Button';
import _, { isEmpty } from 'lodash';
import { handleCircularStructureToJSON, hasCircularDependency, verifyConstant } from '@/_helpers/utils';
import Popover from 'react-bootstrap/Popover';
import Card from 'react-bootstrap/Card';
// eslint-disable-next-line import/no-unresolved
import { JsonViewer } from '@textea/json-viewer';
import { reservedKeywordReplacer } from '@/_lib/reserved-keyword-replacer';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { Overlay } from 'react-bootstrap';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

import { findDefault } from '../_utils/component-properties-validation';
import FixWithAi from './FixWithAi';

const sanitizeLargeDataset = (data, callback) => {
  const SIZE_LIMIT_KB = 5 * 1024; // 5 KB in bytes

  const estimateSizeOfObject = (object) => {
    const visited = new Set();

    function sizeOf(obj) {
      if (obj === null || typeof obj !== 'object') return 0;
      if (visited.has(obj)) return 0;
      visited.add(obj);

      let bytes = 0;

      for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          bytes += key.length * 2;

          const value = obj[key];
          switch (typeof value) {
            case 'boolean':
              bytes += 4;
              break;
            case 'number':
              bytes += 8;
              break;
            case 'string':
              bytes += value.length * 2;
              break;
            case 'object':
              if (Array.isArray(value)) {
                bytes += value.reduce((acc, el) => acc + sizeOf(el), 0);
              } else {
                bytes += sizeOf(value);
              }
              break;
          }
        }
      }

      return bytes;
    }

    return sizeOf(object);
  };

  function trimTo5KB(str) {
    let bytes = 0;
    let result = '';

    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const charBytes = charCode <= 0x7f ? 1 : 2; // basic approximation for UTF-16

      if (bytes + charBytes > SIZE_LIMIT_KB) {
        break;
      }

      result += str[i];
      bytes += charBytes;
    }

    return result + '...';
  }

  const sanitize = (input) => {
    if (typeof input === 'string') return trimTo5KB(input);
    if (typeof input !== 'object' || input === null) return input;

    if (Array.isArray(input)) {
      const size = estimateSizeOfObject(input);
      callback(size > SIZE_LIMIT_KB);

      return data.length > 10 && size > SIZE_LIMIT_KB
        ? [input[0], `Too large to display: ${input.length - 1} more items`]
        : input;
    } else {
      const sanitizedData = Object.entries(input).reduce((acc, [key, value]) => {
        const sizeOfEachElement = estimateSizeOfObject(value);

        if (Array.isArray(value) && (data.length > 10 || sizeOfEachElement > SIZE_LIMIT_KB)) {
          acc[key] = [value[0], `Too large to display: ${value.length - 1} more items`];
        } else {
          acc[key] = sanitize(value);
        }

        return acc;
      }, {});

      return sanitizedData;
    }
  };

  return sanitize(data);
};

export const PreviewBox = ({
  currentValue,
  validationSchema,
  setErrorStateActive,
  setErrorMessage,
  customVariables,
  isWorkspaceVariable,
  validationFn,
}) => {
  const { moduleId } = useModuleContext();
  const [resolvedValue, setResolvedValue] = useState('');
  const [error, setError] = useState(null);
  const [coersionData, setCoersionData] = useState(null);
  const [largeDataset, setLargeDataset] = useState(false);
  const globals = useStore((state) => state.getAllExposedValues(moduleId).constants || {}, shallow);
  const secrets = useStore((state) => state.getSecrets(), shallow);
  const globalServerConstantsRegex = /\{\{.*globals\.server.*\}\}/;

  const getPreviewContent = (content, type) => {
    if (content === undefined || content === null) return currentValue;
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
  let isGlobalConstant = currentValue && currentValue.includes('{{constants.');
  let isSecretConstant = currentValue && currentValue.includes('{{secrets.');
  const isServerConstant = currentValue && currentValue.match(globalServerConstantsRegex);
  let invalidConstants = null;
  let undefinedError = null;
  if (isGlobalConstant || isSecretConstant) {
    invalidConstants = verifyConstant(currentValue, globals, secrets);
  }
  if (invalidConstants?.length) {
    undefinedError = { type: 'Invalid constants' };
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
      setErrorMessage(error);
    } else {
      setErrorStateActive(false);
      setErrorMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    const [valid, _error, rawNewValue, rawResolvedValue] = resolveReferences(
      currentValue,
      validationSchema,
      customVariables,
      validationFn
    );

    const completeErrMessage = Array.isArray(_error) ? _error.join('.') : _error;

    const resolvedValue = typeof rawResolvedValue === 'function' ? undefined : rawResolvedValue;

    const newValue = typeof rawNewValue === 'function' ? undefined : rawNewValue;
    const isSecretError =
      currentValue?.includes('secrets.') || _error?.includes('ReferenceError: secrets is not defined');

    if ((isWorkspaceVariable || !validationSchema || isEmpty(validationSchema)) && !validationFn) {
      return setResolvedValue(newValue);
    }

    // we dont need to add or update the resolved value if the value has deep children
    const _resolveValue = sanitizeLargeDataset(resolvedValue, setLargeDataset);

    if (valid && !isSecretError) {
      const [coercionPreview, typeAfterCoercion, typeBeforeCoercion] = computeCoercion(resolvedValue, newValue);

      setResolvedValue(_resolveValue);

      setCoersionData({
        coercionPreview,
        typeAfterCoercion,
        typeBeforeCoercion,
      });
      setError(null);
    } else if (!valid && !newValue && !resolvedValue && !isSecretError) {
      const err = !error ? `Invalid value for ${validationSchema?.schema?.type}` : `${_error}`;
      setError({ message: err, value: resolvedValue, type: 'Invalid', completeErrorMessage: completeErrMessage });
    } else {
      const jsErrorType = isSecretError
        ? 'Error'
        : _error?.includes('ReferenceError')
        ? 'ReferenceError'
        : _error?.includes('TypeError')
        ? 'TypeError'
        : _error?.includes('SyntaxError')
        ? 'SyntaxError'
        : 'Invalid';

      const errValue = ifCoersionErrorHasCircularDependency(_resolveValue);

      setError({
        message: isServerConstant
          ? 'Server variables cannot be used in apps'
          : isSecretError
          ? 'secrets cannot be used in apps'
          : _error,
        value: isSecretError
          ? 'Undefined'
          : jsErrorType === 'Invalid'
          ? JSON.stringify(errValue, reservedKeywordReplacer)
          : resolvedValue,
        type: isSecretError ? 'Error' : jsErrorType,
        completeErrorMessage: completeErrMessage,
      });
      setCoersionData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  return (
    <>
      <PreviewBox.RenderResolvedValue
        error={error || undefinedError}
        currentValue={currentValue}
        previewType={previewType}
        resolvedValue={content}
        coersionData={coersionData}
        withValidation={!isEmpty(validationSchema)}
        isWorkspaceVariable={isWorkspaceVariable}
        isSecretConstant={isSecretConstant || false}
        isLargeDataset={largeDataset}
        isServerConstant={isServerConstant}
      />
      <CodeHinter.PopupIcon
        callback={() => copyToClipboard(error ? error?.value : content)}
        icon={'copy'}
        tip={'Copy to clipboard'}
      />
    </>
  );
};

const RenderResolvedValue = ({
  error,
  previewType,
  resolvedValue,
  coersionData,
  withValidation,
  isWorkspaceVariable,
  isSecretConstant = false,
  isServerConstant = false,
  isLargeDataset,
}) => {
  const isServerSideGlobalResolveEnabled = useStore(
    (state) => !!state?.license?.featureAccess?.serverSideGlobalResolve,
    shallow
  );

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

  const previewValueType = isWorkspaceVariable
    ? previewType
    : withValidation || (coersionData && coersionData?.typeBeforeCoercion)
    ? `${coersionData?.typeBeforeCoercion} ${
        coersionData?.coercionPreview ? ` → ${coersionData?.typeAfterCoercion}` : ''
      }`
    : previewType;

  const previewContent = isServerConstant
    ? isServerSideGlobalResolveEnabled
      ? 'Server variables would be resolved at runtime'
      : 'Server variables are only available in paid plans'
    : isSecretConstant
    ? 'Values of secret constants are hidden'
    : !withValidation
    ? resolvedValue
    : computeCoersionPreview(resolvedValue, coersionData);

  const cls = error ? 'codehinter-error-banner' : 'codehinter-success-banner';

  return (
    <div className={`d-flex flex-column align-content-between flex-wrap`}>
      <div className="p-2">
        <span className={`badge text-capitalize font-500 ${cls}`}> {error ? error.type : previewValueType}</span>
      </div>

      <PreviewBox.CodeBlock code={error ? error.value : previewContent} isLargeDataset={isLargeDataset} />
    </div>
  );
};

const PreviewContainer = ({
  children,
  isFocused,
  enablePreview,
  setCursorInsidePreview,
  isPortalOpen,
  previewRef,
  showPreview,
  onAiSuggestionAccept,
  ...restProps
}) => {
  const {
    validationSchema,
    isWorkspaceVariable,
    errorStateActive,
    previewPlacement,
    validationFn,
    componentId,
    paramName,
    fieldMeta,
    setIsFocused,
    currentValue,
  } = restProps;

  const aiFeaturesEnabled = useStore((state) => state.ai?.aiFeaturesEnabled ?? false);
  const fetchErrorFixUsingAi = useStore((state) => state.fetchErrorFixUsingAi);
  const clearChatHistory = useStore((state) => state.clearChatHistory);
  const componentDefinition = useStore((state) => state.getComponentDefinition(componentId), shallow); // TODO: check if moduleId needs to be passed here

  const componentName = componentDefinition?.component?.name;
  const componentKey = `${componentName} - ${fieldMeta?.displayName}`;

  const chatList = useStore((state) => state.fixWithAiSlice?.[componentId]?.[componentKey]?.chatHistory ?? []);

  const [errorMessage, setErrorMessage] = useState(null);

  const [popoverToShow, setPopoverToShow] = useState('preview'); // preview | fixWithAI

  const errMsg = errorMessage?.message ?? null;

  const typeofError = getCurrentNodeType(errMsg);

  const errorMsg = typeofError === 'Array' ? errMsg[0] : errMsg;

  const darkMode = localStorage.getItem('darkMode') === 'true';

  useEffect(() => {
    !showPreview && setPopoverToShow('preview');
  }, [showPreview]);

  useEffect(() => {
    setPopoverToShow('preview');

    if (chatList?.length) {
      clearChatHistory(componentId, componentKey);
    }
  }, [currentValue]);

  const fetchFixUsingAi = () => {
    const defaultValue = validationSchema?.defaultValue
      ? validationSchema?.defaultValue
      : validationSchema
      ? findDefault(validationSchema?.schema ?? {}, errorMessage?.value)
      : undefined;

    const errorData = {
      key: componentKey,
      componentId: componentId,
      message: errorMessage?.completeErrorMessage,
      error: {
        resolvedProperty: { [paramName]: errorMessage?.value },
        effectiveProperty: { [paramName]: defaultValue },
        componentId,
      },
    };

    fetchErrorFixUsingAi(errorData, {
      componentDisplayName:
        componentDefinition?.component?.displayName ?? componentDefinition?.component?.component ?? componentName,
      errorPropertyDisplayName: fieldMeta?.displayName,
      customErrMessage: errorMessage?.message,
    });
  };

  const handleFixErrorWithAI = () => {
    setPopoverToShow('fixWithAI');

    if (!componentId || chatList?.length) {
      return;
    }

    fetchFixUsingAi();
  };

  const fixWithAIPopover = (
    <Popover
      bsPrefix="fix-with-ai-popover"
      id="popover-basic"
      className={`${darkMode && 'dark-theme'} tw-z-[9999] tw-w-96`}
      onMouseEnter={() => setCursorInsidePreview(true)}
      onMouseLeave={() => setCursorInsidePreview(false)}
    >
      <Popover.Body
        style={{
          border: '1px solid var(--slate6)',
          padding: 0,
          boxShadow: ' 0px 4px 8px 0px #3032331A, 0px 0px 1px 0px #3032330D',
        }}
      >
        <FixWithAi
          componentId={componentId}
          componentKey={componentKey}
          onApplyFix={onAiSuggestionAccept}
          onRetry={fetchFixUsingAi}
          onClose={() => setIsFocused(false)}
        />
      </Popover.Body>
    </Popover>
  );

  const popover = (
    <Popover
      bsPrefix="codehinter-preview-popover"
      id="popover-basic"
      className={`${darkMode && 'dark-theme'}`}
      style={{
        zIndex: 1400,
      }}
      onMouseEnter={() => setCursorInsidePreview(true)}
      onMouseLeave={() => setCursorInsidePreview(false)}
    >
      <Popover.Body
        style={{
          border: !isEmpty(validationSchema) && '1px solid var(--slate6)',
          padding: isEmpty(validationSchema) && !validationFn && '0px',
          boxShadow: ' 0px 4px 8px 0px #3032331A, 0px 0px 1px 0px #3032330D',
          width: '250px',
          maxWidth: '350px',
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

                {aiFeaturesEnabled && (
                  <Button
                    size="medium"
                    variant="outline"
                    leadingIcon="tooljetai"
                    className="mt-2"
                    onClick={handleFixErrorWithAI}
                  >
                    Fix with AI
                  </Button>
                )}
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
    <>
      {!isPortalOpen && (
        <Overlay
          placement={previewPlacement || 'left'}
          {...(previewRef?.current ? { target: previewRef.current } : {})}
          show={showPreview}
          rootClose
          shouldUpdatePosition={true}
          container={document.body}
          popperConfig={{
            modifiers: [
              {
                name: 'flip',
                options: {
                  fallbackPlacements: ['top', 'bottom', 'left', 'right'],
                  flipVariations: true,
                  allowedAutoPlacements: ['top', 'bottom'],
                  boundary: 'viewport',
                },
              },
              {
                name: 'preventOverflow',
                options: {
                  enabled: true,
                  boundary: 'viewport',
                  altAxis: true,
                  tether: false,
                },
              },
              {
                name: 'offset',
                options: {
                  offset: [0, 3],
                },
              },
            ],
            onFirstUpdate: (state) => {
              // Force position update on first render
              // This is done to avoid scroll issue
              if (state.elements.popper) {
                state.elements.popper.style.position = 'fixed';
              }
            },
          }}
        >
          {(props) => React.cloneElement(popoverToShow === 'fixWithAI' ? fixWithAIPopover : popover, props)}
        </Overlay>
      )}

      {children}
    </>
  );
};

const PreviewCodeBlock = ({ code, isExpectValue = false, isLargeDataset }) => {
  let preview;
  if (typeof code === 'string') {
    preview = code.trim();
  } else if (typeof code === 'symbol') {
    preview = code.toString();
  } else {
    preview = String(code);
  }

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

    const hasDeepChild = hasDeepChildren(prettyPrintedJson);

    return (
      <div className="preview-json">
        <JsonViewer
          value={prettyPrintedJson}
          displayDataTypes={false}
          displaySize={false}
          enableClipboard={false}
          rootName={false}
          theme={darkMode ? 'dark' : 'light'}
          groupArraysAfterLength={hasDeepChild ? 10 : 100}
          maxDisplayLength={hasDeepChild ? 10 : 50}
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
