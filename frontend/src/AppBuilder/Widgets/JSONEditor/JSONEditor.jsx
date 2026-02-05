/* eslint-disable import/no-unresolved */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Loader from '@/ToolJetUI/Loader/Loader';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { foldAll, unfoldAll, foldEffect, unfoldEffect } from '@codemirror/language';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { linter, lintGutter } from '@codemirror/lint';
import './jsonEditor.scss';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';

export async function loadCodeMirrorTheme(theme) {
  const mod = await import('@uiw/codemirror-themes-all');
  switch (theme) {
    case 'monokai':
      return mod.monokai;
    case 'solarized':
      return mod.solarizedDark;
    case 'tomorrow':
      return mod.tomorrowNightBlue;
    case 'bespin':
      return mod.bespin;
    default:
      return mod.monokai;
  }
}

export const JSONEditor = function JSONEditor(props) {
  // ===== PROPS DESTRUCTURING =====
  const {
    id,
    height,
    properties,
    styles,
    setExposedVariable,
    setExposedVariables,
    darkMode,
    adjustComponentPositions,
    currentLayout,
    width,
    currentMode,
    subContainerIndex,
  } = props;

  const { value, shouldExpandEntireJSON, loadingState, visibility, disabledState, theme } = properties;
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen, shallow);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);

  // ===== STATE MANAGEMENT =====
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState,
    value: JSON.stringify(value, null, 2),
  });
  const [forceDynamicHeightUpdate, setForceDynamicHeightUpdate] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState(undefined);
  const editorRef = useRef(null);
  const foldingAppliedRef = useRef(false);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: forceDynamicHeightUpdate,
    adjustComponentPositions,
    currentLayout,
    width,
    visibility,
    subContainerIndex,
  });

  // ===== HELPER FUNCTIONS =====
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const setValue = (newValue) => {
    updateExposedVariablesState('value', newValue);
    setForceDynamicHeightUpdate((prev) => !prev);
    try {
      const parsedValue = JSON.parse(newValue);
      setExposedVariables({ value: parsedValue, isValid: true });
    } catch (error) {
      setExposedVariable('isValid', false);
    }
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
    height: isDynamicHeightEnabled ? '100%' : height,
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

  const extensions = useMemo(() => {
    const ThemeOverride = EditorView.theme(
      {
        '.cm-scroller': {
          backgroundColor: backgroundColor,
        },
      },
      { dark: darkMode }
    );

    // 🔑 Folding init listener
    const foldingInitListener = EditorView.updateListener.of((update) => {
      if (!editorRef.current) return;
      if (foldingAppliedRef.current) return;

      // Wait until:
      // 1. Document exists
      // 2. Language has produced fold ranges
      if (!update.view.state.doc.length) return;

      // First meaningful update → folding is now safe
      foldingAppliedRef.current = true;

      queueMicrotask(() => {
        if (shouldExpandEntireJSON) {
          unfoldAll(update.view);
        } else {
          foldAll(update.view);
        }
      });
    });

    // Listen for fold/unfold events to trigger dynamic height recalculation
    const foldListener = EditorView.updateListener.of((update) => {
      if (!update.transactions.length || !isDynamicHeightEnabled) return;

      for (const tr of update.transactions) {
        for (const effect of tr.effects) {
          if (effect.is(foldEffect) || effect.is(unfoldEffect)) {
            // Trigger dynamic height update when content is folded/unfolded
            setForceDynamicHeightUpdate((prev) => !prev);
            break;
          }
        }
      }
    });

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
      foldingInitListener,
      foldListener,
    ];
  }, [backgroundColor, darkMode, isDynamicHeightEnabled, shouldExpandEntireJSON]);

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
      dep: value,
      sideEffect: () => {
        updateExposedVariablesState('value', JSON.stringify(value, null, 2));
        setForceDynamicHeightUpdate((prev) => !prev);
        setExposedVariables({ value: value, isValid: true });
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

  // Reset the folding flag when shouldExpandEntireJSON changes
  useEffect(() => {
    foldingAppliedRef.current = false;
  }, [shouldExpandEntireJSON]);

  useEffect(() => {
    if (!editorRef.current) return;

    // Give a microtask delay to ensure the view is ready
    queueMicrotask(() => {
      if (!editorRef.current) return;

      if (shouldExpandEntireJSON) {
        unfoldAll(editorRef.current);
      } else {
        foldAll(editorRef.current);
      }
    });
  }, [shouldExpandEntireJSON]);

  useEffect(() => {
    let cancelled = false;

    loadCodeMirrorTheme(theme).then((cmTheme) => {
      if (!cancelled) {
        setResolvedTheme(cmTheme);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [theme]);

  useEffect(() => {
    const exposedVariables = {
      value: value,
      isValid: true,
      isLoading: loadingState,
      isVisible: visibility,
      isDisabled: disabledState,
      setValue: async function (value) {
        if (typeof value === 'object') {
          setValue(JSON.stringify(value, null, 2));
          setExposedVariables({ value: value, isValid: true });
        } else {
          setValue(String(value));
          setExposedVariables({ value: value, isValid: false });
        }
      },
      setLoading: async function (value) {
        updateExposedVariablesState('isLoading', !!value);
        setExposedVariable('isLoading', !!value);
      },
      setVisibility: async function (value) {
        updateExposedVariablesState('isVisible', !!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisable: async function (value) {
        updateExposedVariablesState('isDisabled', !!value);
        setExposedVariable('isDisabled', !!value);
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== MAIN RENDER =====
  return (
    <div className="json-editor-widget scrollbar-container" style={containerComputedStyles}>
      {exposedVariablesTemporaryState.isLoading ? (
        <Loader width="24" absolute={false} />
      ) : (
        <CodeMirror
          onCreateEditor={(view) => {
            editorRef.current = view;
          }}
          value={exposedVariablesTemporaryState.value}
          onFocus={() => {
            setSelectedComponents([id]);
            setRightSidebarOpen(true);
            setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
          }}
          height={'100%'}
          minHeight={isDynamicHeightEnabled ? `${height}px` : height}
          maxHeight={isDynamicHeightEnabled ? 'none' : height}
          width="100%"
          theme={resolvedTheme}
          extensions={extensions}
          onChange={(newValue) => {
            setValue(newValue);
          }}
          basicSetup={basicSetup}
          // className={`codehinter-multi-line-input`}
          indentWithTab={true}
        />
      )}
    </div>
  );
};
