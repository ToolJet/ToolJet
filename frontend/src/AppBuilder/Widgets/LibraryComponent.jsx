import React, { useEffect, useMemo, useRef, useState } from 'react';

import useStore from '@/AppBuilder/_stores/store';
import Loader from '@/ToolJetUI/Loader/Loader';
import { cn } from '@/lib/utils';
import { libraryFileUrl } from '@/_helpers/customComponentLibrariesStoreUtils';
import { useEffectiveLibraryRevision } from './hooks/useEffectiveLibraryRevision';
import { useLibraryManifest } from './hooks/useLibraryManifest';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import InlineLibraryComponent from './LibraryComponent/InlineLibraryComponent';
import { getLibraryComponentRuntime } from './LibraryComponent/inlineRuntime';
import { isBuiltinLibrary } from '@/_helpers/builtinPacks';
import LibrarySlotCanvas from './LibraryComponent/LibrarySlotCanvas';
import { usePackHost, useRowTemplates } from './LibraryComponent/usePackHost';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';

const DevBadge = ({ label }) => (
  <div className="tw-absolute tw-left-0 -tw-bottom-6 tw-h-5 tw-inline-flex tw-items-center tw-px-1 tw-py-0.5 tw-rounded-md tw-text-white tw-text-sm tw-font-medium tw-whitespace-nowrap tw-pointer-events-none tw-z-10 tw-bg-background-success-strong">
    dev: {label}
  </div>
);

const META_KEYS = new Set([
  'libraryId',
  'correlationId',
  'libraryName',
  'componentName',
  'visibility',
  'loadingState',
  // The host's standard properties (pack contract v2): the component reads them through ToolJet.useControlState.
  'disabledState',
  'dynamicHeight',
]);
// Styles the host widget applies itself; every other style key is the bundle's (ToolJet.useStyleX).
const HOST_STYLE_KEYS = new Set(['boxShadow']);

/* A built-in pack renders inline (shadow root + host React, see LibraryComponent/inlineRuntime.ts); an uploaded
   library renders in the shell below. localStorage 'tj-cc-runtime' = 'iframe' sends a built-in pack there too.

   sandboxed (opaque-origin) iframe — no parent DOM/cookie access, postMessage only:
   shell → ready → we send load {bundleUrl, cssUrl, componentName}
   props change → we send props
   shell → stateChange/event → setExposedVariable / fireEvent
*/
const LibraryComponent = ({
  id,
  properties = {},
  styles = {},
  darkMode,
  height,
  setExposedVariable,
  setExposedVariables,
  resetExposedVariables,
  fireEvent,
  dataCy,
  ...hostProps
}) => {
  const { libraryId, correlationId, componentName } = properties;
  const safeHeight = Math.max(height ?? 0, 0);

  // Mirrors every other widget's setVisibility/setLoading CSA — local state, flippable
  // imperatively via the action, independent of the properties bindings WidgetWrapper reads.
  const resolvedVisibility = properties.visibility ?? true;
  const resolvedLoading = properties.loadingState ?? false;

  const resolvedDisabled = properties.disabledState === true;
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isVisible: resolvedVisibility,
    isLoading: resolvedLoading,
    isDisabled: resolvedDisabled,
  });

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  // Shared by the mount effect and the identity-reset effect below, so both declare
  // the same static exposed variables. Reads resolvedVisibility/resolvedLoading, not
  // exposedVariablesTemporaryState, to avoid a same-commit stale-state read.
  const buildStaticExposedVariables = () => ({
    isVisible: resolvedVisibility,
    isLoading: resolvedLoading,
    setVisibility: async function (value) {
      setExposedVariable('isVisible', !!value);
      updateExposedVariablesState('isVisible', !!value);
    },
    setLoading: async function (value) {
      setExposedVariable('isLoading', !!value);
      updateExposedVariablesState('isLoading', !!value);
    },
    isDisabled: resolvedDisabled,
    setDisable: async function (value) {
      setExposedVariable('isDisabled', !!value);
      updateExposedVariablesState('isDisabled', !!value);
    },
  });

  useEffect(() => {
    setExposedVariables(buildStaticExposedVariables());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Property bindings changing after mount — batched into one effect instead of
  // one useEffect per property (see useBatchedUpdateEffectArray).
  useBatchedUpdateEffectArray([
    {
      dep: resolvedVisibility,
      sideEffect: () => {
        setExposedVariable('isVisible', resolvedVisibility);
        updateExposedVariablesState('isVisible', resolvedVisibility);
      },
    },
    {
      dep: resolvedLoading,
      sideEffect: () => {
        setExposedVariable('isLoading', resolvedLoading);
        updateExposedVariablesState('isLoading', resolvedLoading);
      },
    },
    {
      dep: resolvedDisabled,
      sideEffect: () => {
        setExposedVariable('isDisabled', resolvedDisabled);
        updateExposedVariablesState('isDisabled', resolvedDisabled);
      },
    },
  ]);

  const currentMode = useStore((state) => state.modeStore?.modules?.canvas?.currentMode ?? 'view');
  // Built-in packs ship with ToolJet like native widgets, in every edition: no licence needed.
  const builtIn = isBuiltinLibrary(correlationId);
  const licensed = useStore((state) => state.license?.featureAccess?.customComponentLibraries === true);
  const hasCustomComponentLibrariesAccess = builtIn || licensed;

  const effectiveRevision = useEffectiveLibraryRevision(correlationId);
  const isDevPin = Boolean(effectiveRevision?.startsWith?.('dev:'));
  const devUserId = isDevPin ? effectiveRevision.slice(4) : undefined;

  const devEmail = useCustomComponentLibrariesStore((state) => state.devPreviewEmailsByUserId?.[devUserId]);
  const devNonce = useCustomComponentLibrariesStore((state) =>
    isDevPin ? state.devBundleUpdatedAt?.[libraryId] : undefined
  );

  const devBadge = isDevPin && currentMode === 'edit' ? <DevBadge label={devEmail ?? devUserId} /> : null;

  // A dev-bundle push, or switching to a different published revision/component export,
  // can remove/rename a `useStateX` variable or an action; setExposedVariable is
  // additive-only (nothing else ever deletes a key from currentState), so a removed
  // variable's last value or a stale action would otherwise linger forever. Reset
  // whenever either the dev nonce or the rendered library identity changes.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    resetExposedVariables?.();
    // Re-declare right after the (synchronous) reset, same effect, so ordering is guaranteed.
    setExposedVariables(buildStaticExposedVariables());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    devNonce,
    libraryId,
    effectiveRevision,
    componentName,
    resetExposedVariables,
    setExposedVariables,
    setExposedVariable,
  ]);

  const configured = Boolean(libraryId && componentName && effectiveRevision);

  const [runtime] = useState(() => getLibraryComponentRuntime());
  const isInline = runtime === 'inline';
  // Inline mode: ToolJet.useAction handlers register here directly, no postMessage round trip.
  const [inlineActions] = useState(() => new Map());

  const iframeRef = useRef(null);
  const [shellReady, setShellReady] = useState(false);
  const pendingInvocations = useRef(new Map());
  const invocationSeq = useRef(0);

  const fileUrl = (file) => libraryFileUrl(libraryId, effectiveRevision, file);

  const manifest = useLibraryManifest(libraryId, effectiveRevision);
  const manifestComponent = manifest?.components?.[componentName];

  // Row-scoped props (ToolJet.useRowResolver) keep their {{rowData...}} / {{cellValue}} templates for the component.
  const { overrides: rowTemplates, markRowScoped } = useRowTemplates({ id, properties, manifestComponent });

  // The component's own props = everything the Inspector sets minus our meta keys.
  const componentProps = useMemo(
    () => ({
      ...Object.fromEntries(Object.entries(properties).filter(([k]) => !META_KEYS.has(k))),
      ...rowTemplates,
    }),
    [properties, rowTemplates]
  );

  // Inspector Styles-tab values for the bundle — passed as styles, never set as exposed variables.
  const componentStyles = useMemo(
    () => Object.fromEntries(Object.entries(styles).filter(([k]) => !HOST_STYLE_KEYS.has(k))),
    [styles]
  );

  // Sends a message from this parent widget down into the widget's iframe.
  const postToShell = (msg) => iframeRef.current?.contentWindow?.postMessage(msg, '*');

  const invokeInline = (name, args) => {
    const handler = inlineActions.get(name);
    if (!handler) console.warn(`[invokeAction] no handler registered for action "${name}".`);
    return Promise.resolve().then(() => handler?.(...(args ?? [])));
  };

  const invokeInShell = (msg) => {
    const id = ++invocationSeq.current;
    return new Promise((resolve, reject) => {
      pendingInvocations.current.set(id, { resolve, reject });
      postToShell({ ...msg, id });
    });
  };

  const rejectAllPending = (reason) => {
    pendingInvocations.current.forEach(({ reject }) => reject(new Error(reason)));
    pendingInvocations.current.clear();
  };

  // Latest render values, readable from the stable message listener below.
  const latest = useRef({});
  latest.current = {
    configured,
    componentName,
    componentProps,
    componentStyles,
    bundleUrl: configured ? fileUrl('index.js') : null,
    cssUrl: configured ? fileUrl('index.css') : null,
  };

  useEffect(() => {
    // Handles a message sent up from the widget's iframe (ready/stateChange/event/actionResult/error).
    const handleMessageFromShell = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const { type, key, value, name, message } = e.data ?? {};
      if (type === 'ready') {
        rejectAllPending('component reloaded before the action completed');
        setShellReady(true);
        const { configured, componentName, componentProps, componentStyles, bundleUrl, cssUrl } = latest.current;
        if (configured) {
          postToShell({ type: 'load', bundleUrl, cssUrl, componentName });
          postToShell({ type: 'props', data: componentProps, styles: componentStyles });
        }
      }
      if (type === 'stateChange') setExposedVariable(key, value);
      if (type === 'event') fireEvent(name, { isCustomComponentEvent: true });
      if (type === 'actionResult') {
        const pending = pendingInvocations.current.get(e.data.id);
        if (pending) {
          pendingInvocations.current.delete(e.data.id);
          if (e.data.error) pending.reject(new Error(e.data.error));
          else pending.resolve(e.data.result);
        }
      }
      if (type === 'error') {
        console.error(`[LibraryComponent] ${message}`);
      }
    };
    window.addEventListener('message', handleMessageFromShell);
    return () => window.removeEventListener('message', handleMessageFromShell);
  }, [setExposedVariable, fireEvent]);

  useEffect(() => {
    setShellReady(false);
  }, [libraryId, effectiveRevision, componentName]);

  const manifestActions = manifestComponent?.actions;

  useEffect(() => {
    if (!configured || !manifestActions?.length) return;
    manifestActions.forEach((a) =>
      setExposedVariable(a.name, (...args) =>
        isInline ? invokeInline(a.name, args) : invokeInShell({ type: 'invokeAction', name: a.name, args })
      )
    );
  }, [configured, manifestActions, setExposedVariable]);

  useEffect(
    () => () => {
      rejectAllPending('component was removed before the action completed');
    },
    []
  );

  useEffect(() => {
    if (!shellReady) return;
    postToShell({ type: 'props', data: componentProps, styles: componentStyles });
  }, [shellReady, componentProps, componentStyles]);

  // Slot drop areas exist only inline: the iframe shell has no way to host ToolJet components.
  const renderSlot = (slotName) => <LibrarySlotCanvas id={`${id}-${slotName}`} darkMode={darkMode} />;

  // Pack contract v2 (manifestVersion 2): the control state, validation, fitted height, list rows and popup drop
  // areas. A v1 manifest gets none of it and renders as before.
  const isLoading = !!exposedVariablesTemporaryState.isLoading;
  // "own": the component draws its loading look from useControlState().loading, so the host draws no overlay and a
  // loading component is not also drawn disabled.
  const ownLoading = isInline && manifestComponent?.loading === 'own';
  const isDisabled = !!exposedVariablesTemporaryState.isDisabled;
  const fit =
    isInline && manifestComponent?.fit === true && properties.dynamicHeight === true && currentMode === 'view';
  const { host, light, popupSlotNames } = usePackHost(
    { id, darkMode, setExposedVariable, height, ...hostProps },
    {
      disabled: isDisabled || (isLoading && !ownLoading),
      loading: isLoading,
      rowsEnabled: isInline && !!manifestComponent?.slots?.some?.((slot) => slot.kind === 'rows'),
      fit,
      visibility: exposedVariablesTemporaryState.isVisible,
      // A field (a validation section) takes part in a Form's clearForm.
      formField: !!manifestComponent?.validation,
      markRowScoped,
    }
  );
  // In an Equal heights row the box is stretched to the tallest sibling; a fitted component fills it.
  const stretch = fit && !!hostProps.boxStretch;
  // A pack in its own design system (themeMode "own": Ant, MUI) takes the app theme only once one is applied; with
  // the basic theme it keeps its stock look. Others (shadcn) always follow the app theme.
  const themeApplied = useStore((state) => {
    const theme = state.globalSettings?.theme;
    return !!theme && !(theme.isBasic ?? theme.is_basic);
  });
  const themed = manifest?.themeMode !== 'own' || themeApplied;
  const fitRef = useRef(null);
  // A pack component draws in its shadow root after the host's first measure (and again whenever its content
  // changes), so the fitted height is measured again on every content resize, as UI 2.0's widgets do (useAutoHeight).
  // Without it a page shown again from cache kept the first, near-empty height and the widgets below rode up over it.
  const contentResized = useHeightObserver(fitRef, fit);
  const fitValue = useMemo(() => ({ properties, contentResized }), [properties, contentResized]);
  useDynamicHeight({
    isDynamicHeightEnabled: fit,
    id,
    height,
    value: fitValue,
    currentLayout: hostProps.currentLayout,
    width: hostProps.width,
    visibility: exposedVariablesTemporaryState.isVisible,
    subContainerIndex: hostProps.subContainerIndex,
  });

  if (!hasCustomComponentLibrariesAccess && currentMode === 'view') {
    return <></>;
  }

  if (!configured) {
    return (
      <div
        data-cy={dataCy}
        // tw-relative anchors the dev badge
        className="tw-relative tw-items-center tw-justify-center tw-border tw-border-dashed tw-border-border-accent-strong tw-rounded tw-text-base tw-text-text-accent"
        // display stays inline: toggled by isVisible at runtime, and jsdom's toHaveStyle
        // (used in tests) only sees inline styles, not compiled Tailwind CSS.
        style={{
          background: 'color-mix(in srgb, var(--cc-primary-brand) 8%, transparent)',
          height: safeHeight,
          display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
        }}
      >
        Slot
        {devBadge}
      </div>
    );
  }

  return (
    <div
      className={cn('tw-relative tw-w-full', {
        'tw-opacity-50 tw-pointer-events-none': !hasCustomComponentLibrariesAccess && currentMode === 'edit',
      })}
      style={{
        height: fit ? (stretch ? '100%' : 'auto') : safeHeight,
        display: exposedVariablesTemporaryState.isVisible ? 'block' : 'none',
      }}
      // While loading or disabled the component stays mounted (what was typed, selected or scrolled is kept) and
      // takes no input; loading shows a spinner over it, unless the component draws its own loading look.
      {...(isLoading || isDisabled ? { inert: '' } : {})}
    >
      {isLoading && isInline && !ownLoading ? (
        <div className="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-bg-[color:color-mix(in_srgb,var(--cc-surface1-surface)_60%,transparent)]">
          <Loader width="16" absolute={false} />
        </div>
      ) : null}
      {isLoading && !isInline ? (
        <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
          <Loader width="16" absolute={false} />
        </div>
      ) : isInline ? (
        <InlineLibraryComponent
          key={`${libraryId}|${effectiveRevision}|${componentName}|${devNonce ?? ''}`}
          bundleUrl={fileUrl('index.js')}
          cssUrl={fileUrl('index.css')}
          cacheKey={`${libraryId}|${effectiveRevision}|${devNonce ?? ''}`}
          isDevBuild={isDevPin}
          componentName={componentName}
          componentProps={componentProps}
          componentStyles={componentStyles}
          renderSlot={renderSlot}
          setExposedVariable={setExposedVariable}
          fireEvent={fireEvent}
          actions={inlineActions}
          boxShadow={styles.boxShadow}
          dataCy={dataCy}
          host={host}
          fit={fit}
          stretch={stretch}
          themed={themed}
          hostRef={fitRef}
          light={light}
          popupSlotNames={popupSlotNames}
          renderPopupSlot={renderSlot}
        />
      ) : (
        <iframe
          key={`${libraryId}|${effectiveRevision}|${componentName}|${devNonce ?? ''}`}
          ref={iframeRef}
          src="/assets/custom-components/shell.html"
          title={componentName}
          data-cy={dataCy}
          // Opaque origin: uploaded/dev-pushed bundle JS gets no window.parent DOM access and no
          // shared cookies/storage — only the postMessage channel above. Do NOT add allow-same-origin.
          sandbox="allow-scripts"
          className="tw-w-full tw-h-full tw-border-0 tw-block"
          style={{ boxShadow: styles.boxShadow }}
        />
      )}
      {devBadge}
    </div>
  );
};

export default LibraryComponent;
