/* eslint-disable import/no-unresolved */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Loader from '@/ToolJetUI/Loader/Loader';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { foldAll, unfoldAll } from '@codemirror/language';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { linter, lintGutter } from '@codemirror/lint';
import './jsonEditor.scss';

export const JSONEditor = function JSONEditor(props) {
  // ===== PROPS DESTRUCTURING =====
  const { properties, styles, setExposedVariable, setExposedVariables, darkMode } = props;

  const { shouldExpandEntireJSON, loadingState, visibility, disabledState } = properties;
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;

  // ===== STATE MANAGEMENT =====
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState,
  });
  const [value, setValue] = useState(JSON.stringify(properties.value, null, 2));
  const editorRef = useRef(null);

  // ===== HELPER FUNCTIONS =====
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  // ===== COMPUTED VALUES =====

  const basicSetup = useMemo(
    () => ({
      lineNumbers: true,
      syntaxHighlighting: true,
      bracketMatching: true,
      foldGutter: true,
      highlightActiveLine: false,
      autocompletion: true,
      highlightActiveLineGutter: false,
      completionKeymap: true,
      searchKeymap: false,
    }),
    []
  );

  const containerComputedStyles = {
    backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: `${borderRadius}px`,
    boxShadow,
    visibility: exposedVariablesTemporaryState.isVisible ? 'visible' : 'hidden',
    ...(exposedVariablesTemporaryState.isLoading
      ? {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }
      : {}),
  };

  const theme = useMemo(() => (darkMode ? okaidia : githubLight), [darkMode]);

  const ThemeOverride = EditorView.theme(
    {
      '.cm-scroller': {
        backgroundColor: backgroundColor,
      },
    },
    { dark: darkMode }
  );

  const extensions = useMemo(() => {
    return [
      json(),
      linter(jsonParseLinter(), {
        markerFilter: () => {
          return [];
        },
        tooltipFilter: () => {
          return [];
        },
      }),
      lintGutter(),
      ThemeOverride,
    ];
  }, [backgroundColor, darkMode]);

  // ===== EFFECTS =====
  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => {
        updateExposedVariablesState('isLoading', loadingState);
        setExposedVariable('isLoading', loadingState);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        updateExposedVariablesState('isVisible', visibility);
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: properties.value,
      sideEffect: () => {
        setValue(JSON.stringify(properties.value, null, 2));
        setExposedVariables({ value: properties.value, isValid: true });
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        updateExposedVariablesState('isDisabled', disabledState);
        setExposedVariable('isDisabled', disabledState);
      },
    },
  ]);

  useEffect(() => {
    if (!editorRef.current) return;

    if (shouldExpandEntireJSON) {
      unfoldAll(editorRef.current);
    } else {
      foldAll(editorRef.current);
    }
  }, [shouldExpandEntireJSON]);

  useEffect(() => {
    const exposedVariables = {
      value: properties.value,
      isValid: true,
      isLoading: loadingState,
      isVisible: visibility,
      isDisabled: disabledState,
      setLoading: async function (value) {
        updateExposedVariablesState('isLoading', !!value);
        setExposedVariable('isLoading', !!value);
      },
      setVisibility: async function (value) {
        updateExposedVariablesState('isVisible', !!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisabled: async function (value) {
        updateExposedVariablesState('isDisabled', !!value);
        setExposedVariable('isDisabled', !!value);
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== MAIN RENDER =====
  return (
    <div className="json-editor-widget" style={containerComputedStyles}>
      {exposedVariablesTemporaryState.isLoading ? (
        <Loader width="24" absolute={false} />
      ) : (
        <CodeMirror
          onCreateEditor={(view) => {
            editorRef.current = view;
          }}
          value={value}
          height={'100%'}
          width="100%"
          theme={theme}
          extensions={extensions}
          onChange={(newValue) => {
            setValue(newValue);
            try {
              const parsedValue = JSON.parse(newValue);
              setExposedVariables({ value: parsedValue, isValid: true });
            } catch (error) {
              setExposedVariable('isValid', false);
            }
          }}
          basicSetup={basicSetup}
          className={`codehinter-multi-line-input`}
          indentWithTab={true}
        />
      )}
    </div>
  );
};
