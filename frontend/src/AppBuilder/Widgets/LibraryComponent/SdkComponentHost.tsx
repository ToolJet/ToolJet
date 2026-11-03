import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import useStore from '@/AppBuilder/_stores/store';
import LoaderJs from '@/ToolJetUI/Loader/Loader';
import { cn } from '@/lib/utils';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import type { LibraryManifest } from '@/AppBuilder/types/libraryComponent.types';
import InlineLibraryComponent, { holdStoreWrites } from './InlineLibraryComponent';
import LibrarySlotCanvas from './LibrarySlotCanvas';
import { usePackHost, useRowTemplates } from './usePackHost';
import type { LibraryRuntime } from './inlineRuntime';
import useThemeAccess from '@/AppBuilder/_hooks/useThemeAccess';
import { baseTheme } from '@/AppBuilder/_stores/utils';
import { canUseTheme } from '@/AppBuilder/_utils/themeAccess';

const Loader = LoaderJs as React.ComponentType<any>;

// Styles the host widget applies itself; every other style key is the bundle's (ToolJet.useStyleX).
const HOST_STYLE_KEYS = new Set(['boxShadow']);
// The host's standard properties: the component reads them through ToolJet.useControlState, never as its own props.
const HOST_PROPERTY_KEYS = ['visibility', 'loadingState', 'disabledState', 'dynamicHeight'];

/** What a host widget (LibraryComponent, PackComponent) resolved its instance to draw. */
export interface SdkComponentSource {
  /** Changes whenever a different bundle or component is drawn: the component remounts and its exposed variables reset. */
  key: string;
  /** Shared by every instance drawing from the same bundle, so it is evaluated once. */
  cacheKey: string;
  bundleUrl: string;
  cssUrl: string;
  componentName: string;
  manifest: LibraryManifest | null;
  runtime: LibraryRuntime;
  isDevBuild?: boolean;
}

interface SdkComponentHostProps {
  id: string;
  properties: Record<string, any>;
  styles: Record<string, any>;
  darkMode: boolean;
  height: number;
  setExposedVariable: (key: string, value: unknown) => void;
  setExposedVariables: (variables: Record<string, unknown>) => void;
  resetExposedVariables?: () => void;
  fireEvent: (event: string, options?: Record<string, unknown>) => void;
  dataCy: string;
  /** null while the instance doesn't yet know what to draw: the Slot placeholder shows. */
  source: SdkComponentSource | null;
  /** The instance's own meta properties (which library or pack it draws), never passed to the component. */
  metaKeys: string[];
  /** Kept from being used (an expired plan): hidden when viewed, dimmed and inert in the editor. */
  blocked?: boolean;
  /** Drawn under the box in the editor (the dev-preview badge). */
  badge?: React.ReactNode;
  [hostProp: string]: any;
}

/* Draws a component built with the custom-component SDK: inline (a shadow root sharing the app's React, see
   inlineRuntime.ts) or in the sandboxed iframe shell. The host widget around it only decides which bundle and component.

   Iframe: opaque origin, no parent DOM/cookie access, postMessage only:
   shell → ready → we send load {bundleUrl, cssUrl, componentName}
   props change → we send props
   shell → stateChange/event → setExposedVariable / fireEvent
*/
const SdkComponentHost = ({
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
  source,
  metaKeys,
  blocked = false,
  badge = null,
  ...hostProps
}: SdkComponentHostProps) => {
  const safeHeight = Math.max(height ?? 0, 0);
  const componentName = source?.componentName;

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

  const updateExposedVariablesState = (key: string, value: boolean) => {
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
    setVisibility: async function (value: unknown) {
      setExposedVariable('isVisible', !!value);
      updateExposedVariablesState('isVisible', !!value);
    },
    setLoading: async function (value: unknown) {
      setExposedVariable('isLoading', !!value);
      updateExposedVariablesState('isLoading', !!value);
    },
    isDisabled: resolvedDisabled,
    setDisable: async function (value: unknown) {
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

  const currentMode = useStore((state: any) => state.modeStore?.modules?.canvas?.currentMode ?? 'view');

  // A dev-bundle push, or switching to a different bundle or component export, can remove/rename a `useStateX`
  // variable or an action; setExposedVariable is additive-only (nothing else ever deletes a key from currentState),
  // so a removed variable's last value or a stale action would otherwise linger forever. Reset whenever what is
  // drawn changes.
  const isFirstRender = useRef(true);
  const sourceKey = source?.key;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    resetExposedVariables?.();
    // Re-declare right after the (synchronous) reset, same effect, so ordering is guaranteed.
    setExposedVariables(buildStaticExposedVariables());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey, resetExposedVariables, setExposedVariables, setExposedVariable]);

  const configured = !!source;
  const isInline = source?.runtime !== 'iframe';
  // Inline mode: ToolJet.useAction handlers register here directly, no postMessage round trip.
  const [inlineActions] = useState(() => new Map<string, (...args: unknown[]) => unknown>());

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [shellReady, setShellReady] = useState(false);
  const pendingInvocations = useRef(
    new Map<number, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>()
  );
  const invocationSeq = useRef(0);

  const manifest = source?.manifest ?? null;
  const manifestComponent = componentName ? manifest?.components?.[componentName] : undefined;

  // Row-scoped props (ToolJet.useRowResolver) keep their {{rowData...}} / {{cellValue}} templates for the component.
  const { overrides: rowTemplates, markRowScoped } = useRowTemplates({ id, properties, manifestComponent });

  // The component's own props = everything the Inspector sets minus the host's keys.
  const componentProps = useMemo(() => {
    const hostKeys = new Set([...metaKeys, ...HOST_PROPERTY_KEYS]);
    return {
      ...Object.fromEntries(Object.entries(properties).filter(([k]) => !hostKeys.has(k))),
      ...rowTemplates,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, rowTemplates, metaKeys.join('|')]);

  // Inspector Styles-tab values for the bundle — passed as styles, never set as exposed variables.
  const componentStyles = useMemo(
    () => Object.fromEntries(Object.entries(styles).filter(([k]) => !HOST_STYLE_KEYS.has(k))),
    [styles]
  );

  // Sends a message from this parent widget down into the widget's iframe.
  const postToShell = (msg: Record<string, unknown>) => iframeRef.current?.contentWindow?.postMessage(msg, '*');

  const invokeInline = (name: string, args: unknown[]) => {
    const handler = inlineActions.get(name);
    if (!handler) console.warn(`[invokeAction] no handler registered for action "${name}".`);
    return Promise.resolve().then(() => handler?.(...(args ?? [])));
  };

  const invokeInShell = (msg: Record<string, unknown>) => {
    const id = ++invocationSeq.current;
    return new Promise((resolve, reject) => {
      pendingInvocations.current.set(id, { resolve, reject });
      postToShell({ ...msg, id });
    });
  };

  const rejectAllPending = (reason: string) => {
    pendingInvocations.current.forEach(({ reject }) => reject(new Error(reason)));
    pendingInvocations.current.clear();
  };

  // Latest render values, readable from the stable message listener below.
  const latest = useRef<Record<string, any>>({});
  latest.current = { source, componentProps, componentStyles };

  useEffect(() => {
    // Handles a message sent up from the widget's iframe (ready/stateChange/event/actionResult/error).
    const handleMessageFromShell = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const { type, key, value, name, message } = e.data ?? {};
      if (type === 'ready') {
        rejectAllPending('component reloaded before the action completed');
        setShellReady(true);
        const { source: current, componentProps, componentStyles } = latest.current;
        if (current) {
          postToShell({
            type: 'load',
            bundleUrl: current.bundleUrl,
            cssUrl: current.cssUrl,
            componentName: current.componentName,
          });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setExposedVariable, fireEvent]);

  useEffect(() => {
    setShellReady(false);
  }, [sourceKey]);

  const manifestActions = manifestComponent?.actions;

  // Every widget of a page gets its manifest in the same commit: their action writes are held and go out together
  // (holdStoreWrites), released by the effect below once the actions are written.
  const actionsHold = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    if (!configured || !manifestActions?.length) return undefined;
    const release = holdStoreWrites();
    const fallback = setTimeout(release, 0);
    actionsHold.current = release;
    return () => {
      clearTimeout(fallback);
      release();
    };
  }, [configured, manifestActions]);

  useEffect(() => {
    if (!configured || !manifestActions?.length) return;
    // One store update for all of the component's actions: one per action re-ran every widget's store selectors, and
    // the manifest arrives after the page's first commit, outside any batch (a page of 100 Ant fields made ~370).
    setExposedVariables(
      Object.fromEntries(
        manifestActions.map((a) => [
          a.name,
          (...args: unknown[]) =>
            isInline ? invokeInline(a.name, args) : invokeInShell({ type: 'invokeAction', name: a.name, args }),
        ])
      )
    );
    actionsHold.current?.();
    actionsHold.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, manifestActions, setExposedVariables]);

  useEffect(
    () => () => {
      rejectAllPending('component was removed before the action completed');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!shellReady) return;
    postToShell({ type: 'props', data: componentProps, styles: componentStyles });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shellReady, componentProps, componentStyles]);

  // Slot drop areas exist only inline: the iframe shell has no way to host ToolJet components.
  const renderSlot = (slotName: string) => <LibrarySlotCanvas id={`${id}-${slotName}`} darkMode={darkMode} />;

  // Pack contract v2: the control state, validation, fitted height, list rows and popup drop areas.
  const isLoading = !!exposedVariablesTemporaryState.isLoading;
  // "own": the component draws its loading look from useControlState().loading, so the host draws no overlay and a
  // loading component is not also drawn disabled.
  const ownLoading = isInline && manifestComponent?.loading === 'own';
  const isDisabled = !!exposedVariablesTemporaryState.isDisabled;
  const fit =
    isInline && manifestComponent?.fit === true && properties.dynamicHeight === true && currentMode === 'view';
  const { host, light, popupSlotNames, exposeVariable, fireHostEvent } = usePackHost(
    { id, darkMode, setExposedVariable, fireEvent, height, ...hostProps },
    {
      disabled: isDisabled || (isLoading && !ownLoading),
      loading: isLoading,
      rowsEnabled: isInline && !!manifestComponent?.slots?.some?.((slot) => slot.kind === 'rows'),
      // What the row's components call their row besides {{listItem}}: a kanban card's {{cardData}}, as UI 2.0's.
      rowVariable: manifestComponent?.slots?.find?.((slot) => slot.kind === 'rows')?.variable,
      fit,
      visibility: exposedVariablesTemporaryState.isVisible,
      // A field (a validation section) takes part in a Form's clearForm.
      formField: !!manifestComponent?.validation,
      markRowScoped,
    }
  );
  // In an Equal heights row the box is stretched to the tallest sibling; a fitted component fills it.
  const stretch = fit && !!hostProps.boxStretch;
  // A pack in its own design system (themeMode "own": Ant, MUI) takes the app theme only once one is chosen; with no
  // theme (the store fills in baseTheme: no id, no basic flag), the basic theme, or a theme the plan cannot use (the
  // app then draws the basic colours), it keeps its stock look. Others (shadcn) always follow the app theme.
  const themeAccess = useThemeAccess();
  const themeApplied = useStore((state: any) => {
    const theme = state.globalSettings?.theme;
    if (!theme || theme === baseTheme || !theme.id || theme.isBasic || theme.is_basic) return false;
    // Until the license has loaded (access undefined) the chosen theme is trusted: a licensed app flipped from stock to
    // themed after mount, and its charts swapped palette mid-animation.
    return canUseTheme(theme, themeAccess === undefined ? true : themeAccess);
  });
  const themed = (manifest as any)?.themeMode !== 'own' || themeApplied;
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

  if (blocked && currentMode === 'view') {
    return <></>;
  }

  if (!source) {
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
        {badge}
      </div>
    );
  }

  return (
    <div
      className={cn('tw-relative tw-w-full', {
        'tw-opacity-50 tw-pointer-events-none': blocked && currentMode === 'edit',
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
          key={source.key}
          bundleUrl={source.bundleUrl}
          cssUrl={source.cssUrl}
          cacheKey={source.cacheKey}
          isDevBuild={!!source.isDevBuild}
          componentName={source.componentName}
          componentProps={componentProps}
          componentStyles={componentStyles}
          renderSlot={renderSlot}
          setExposedVariable={exposeVariable}
          fireEvent={fireHostEvent}
          actions={inlineActions}
          boxShadow={styles.boxShadow}
          dataCy={dataCy}
          host={host}
          fit={fit}
          stretch={stretch}
          reserveHeight={height}
          themed={themed}
          darkMode={darkMode}
          hostRef={fitRef}
          light={light}
          popupSlotNames={popupSlotNames}
          renderPopupSlot={renderSlot}
        />
      ) : (
        <iframe
          key={source.key}
          ref={iframeRef}
          src="/assets/custom-components/shell.html"
          title={source.componentName}
          data-cy={dataCy}
          // Opaque origin: uploaded/dev-pushed bundle JS gets no window.parent DOM access and no
          // shared cookies/storage — only the postMessage channel above. Do NOT add allow-same-origin.
          sandbox="allow-scripts"
          className="tw-w-full tw-h-full tw-border-0 tw-block"
          style={{ boxShadow: styles.boxShadow }}
        />
      )}
      {badge}
    </div>
  );
};

export default SdkComponentHost;
