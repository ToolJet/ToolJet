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
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/mediaC';

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
    currentLayout,
    width,
    currentMode,
    subContainerIndex,
    componentType,
    moduleId,
    resolveIndex,
  } = props;

  const { value, shouldExpandEntireJSON, loadingState, visibility, disabledState, theme } = properties;
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen, shallow);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);

  // ===== STATE MANAGEMENT =====
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const isInitialRender = useRef(true);

  const exposedOpts = { resolveIndex, moduleId };
  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent: undefined,
  });

  // Store is the source of truth for isVisible/isLoading/isDisabled. The
  // editor's raw text buffer stays local — it must diverge from the parsed
  // exposed `value` while the user is mid-typing invalid JSON (old
  // exposedVariablesTemporaryState.value played the same role).
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);
  const [displayValue, setDisplayValue] = useState(() => JSON.stringify(value, null, 2));

  const [forceDynamicHeightUpdate, setForceDynamicHeightUpdate] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState(undefined);
  const editorRef = useRef(null);
  const foldingAppliedRef = useRef(false);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: forceDynamicHeightUpdate,
    currentLayout,
    width,
    visibility,
    subContainerIndex,
    componentType,
  });

  // ===== HELPER FUNCTIONS =====
  // Editor-driven typing path — parses the raw string; on invalid JSON the
  // exposed `value` is left untouched (old behavior), only isValid flips.
  const handleEditorChange = (newValue) => {
    setDisplayValue(newValue);
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
    visibility: isVisible ? 'visible' : 'hidden',
    ...(isLoading
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
          flexGrow: 1,
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

  // ===== EFFECTS (property-sync write-throughs; skip-initial) ──────────
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setDisplayValue(JSON.stringify(value, null, 2));
    setForceDynamicHeightUpdate((prev) => !prev);
    setExposedVariables({ value: value, isValid: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

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

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers
  // (setValue overridden to also update the local editor text buffer).
  useEffect(() => {
    setExposedVariables({
      value: value,
      isValid: true,
      isLoading: loadingState,
      isVisible: visibility,
      isDisabled: disabledState,
      ...csaShims(),
      setValue: async function (newValue) {
        setDisplayValue(typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : String(newValue));
        setForceDynamicHeightUpdate((prev) => !prev);
        dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [newValue] }]);
      },
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== MAIN RENDER =====
  return (
    <div className="json-editor-widget scrollbar-container" style={containerComputedStyles}>
      {isLoading ? (
        <Loader width="24" absolute={false} />
      ) : (
        <CodeMirror
          onCreateEditor={(view) => {
            editorRef.current = view;
          }}
          value={displayValue}
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
            handleEditorChange(newValue);
          }}
          basicSetup={basicSetup}
          // className={`codehinter-multi-line-input`}
          indentWithTab={true}
        />
      )}
    </div>
  );
};
