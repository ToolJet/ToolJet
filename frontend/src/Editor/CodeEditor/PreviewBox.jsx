import React, { useContext, useEffect, useState } from 'react';
import { useSpring, config, animated } from 'react-spring';
import useHeight from '@/_hooks/use-height-transition';
import { computeCoercion, getCurrentNodeType, resolveReferences } from './utils';
import { EditorContext } from '../Context/EditorContextWrapper';
import NewCodeHinter from '.';
import { copyToClipboard } from '@/_helpers/appUtils';
import { Alert } from '@/_ui/Alert/Alert';
import { isEmpty } from 'lodash';

export const PreviewBox = ({ currentValue, isFocused, validationSchema, setErrorStateActive, componentId }) => {
  // Todo: (isWorkspaceVariable) Remove this when workspace variables are deprecated
  const isWorkspaceVariable =
    typeof currentValue === 'string' && (currentValue.includes('%%client') || currentValue.includes('%%server'));

  const { variablesExposedForPreview } = useContext(EditorContext);

  const customVariables = variablesExposedForPreview?.[componentId] ?? {};

  const [resolvedValue, setResolvedValue] = useState('');
  const [error, setError] = useState(null);
  const [coersionData, setCoersionData] = useState(null);

  const [heightRef, currentHeight] = useHeight();
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const themeCls = darkMode ? 'bg-dark  py-1' : 'bg-light  py-1';

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

  const slideInStyles = useSpring({
    config: { ...config.stiff },
    from: { opacity: 0, height: 0 },
    to: {
      opacity: isFocused ? 1 : 0,
      height: isFocused ? currentHeight + (isWorkspaceVariable ? 30 : 0) : 0,
    },
  });

  let previewType = getCurrentNodeType(resolvedValue);
  let previewContent = resolvedValue;

  const content = getPreviewContent(previewContent, previewType);

  useEffect(() => {
    if (error) {
      setErrorStateActive(true);
    } else {
      setErrorStateActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    const [valid, error, newValue, resolvedValue] = resolveReferences(currentValue, validationSchema, customVariables);

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
      const err = !error ? `Invalid value for ${validationSchema?.schema?.type}` : `${error}`;
      setError(err);
    } else {
      setError(error);
      setCoersionData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  return (
    <animated.div className={isFocused ? themeCls : null} style={{ ...slideInStyles, overflow: 'hidden' }}>
      <div ref={heightRef} className={`dynamic-variable-preview px-1 py-1 ${!error ? 'bg-green-lt' : 'bg-red-lt'}`}>
        <PreviewBox.PreviewCode
          error={error}
          previewType={previewType}
          resolvedValue={content}
          coersionData={coersionData}
          isFocused={isFocused}
          withValidation={!isEmpty(validationSchema)}
        />
      </div>
      {isWorkspaceVariable && <DepericatedAlertForWorkspaceVariable text={'Deprecating soon'} />}
    </animated.div>
  );
};

const Preview = ({ error, ...restProps }) => {
  if (error) {
    return <PreviewBox.RenderError error={error} heightRef={restProps.heightRef} />;
  }

  return <PreviewBox.RenderResolvedValue {...restProps} />;
};

const RenderResolvedValue = ({ previewType, resolvedValue, coersionData, isFocused, withValidation }) => {
  const previewValueType =
    withValidation || (coersionData && coersionData?.typeBeforeCoercion)
      ? `${coersionData?.typeBeforeCoercion} ${
          coersionData?.coercionPreview ? ` → ${coersionData?.typeAfterCoercion}` : ''
        }`
      : previewType;

  const previewContent = !withValidation ? resolvedValue : resolvedValue + coersionData?.coercionPreview;

  return (
    <div className="dynamic-variable-preview-content" style={{ whiteSpace: 'pre-wrap' }}>
      <div className="d-flex my-1">
        <div className="flex-grow-1" style={{ fontWeight: 700, textTransform: 'capitalize' }}>
          {previewValueType}
        </div>
        {isFocused && (
          <div className="preview-icons position-relative">
            <NewCodeHinter.PopupIcon
              callback={() => {
                copyToClipboard(resolvedValue);
              }}
              icon="copy"
              tip="Copy to clipboard"
            />
          </div>
        )}
      </div>
      {previewContent}
    </div>
  );
};

const RenderError = ({ error }) => {
  const typeofError = getCurrentNodeType(error);

  const errorMessage = typeofError === 'Array' ? error[0] : JSON.stringify(error);

  return (
    <div>
      <div className="heading my-1">
        <span>Error</span>
      </div>
      {errorMessage}
    </div>
  );
};

const DepericatedAlertForWorkspaceVariable = ({ text }) => {
  return (
    <Alert
      svg="tj-info-warning"
      cls="codehinter workspace-variables-alert-banner p-1 mb-0"
      data-cy={``}
      imgHeight={18}
      imgWidth={18}
    >
      <div className="d-flex align-items-center">
        <div class="">{text}</div>
      </div>
    </Alert>
  );
};

PreviewBox.PreviewCode = Preview;
PreviewBox.RenderResolvedValue = RenderResolvedValue;
PreviewBox.RenderError = RenderError;
