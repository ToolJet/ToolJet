import React, { useEffect, useRef } from 'react';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import cx from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

const Icon = ({
  id,
  properties,
  styles,
  fireEvent,
  height,
  width,
  setExposedVariables,
  darkMode,
  dataCy,
  componentType,
  moduleId,
  resolveIndex,
}) => {
  const isInitialRender = useRef(true);
  const { icon, loadingState, disabledState } = properties;
  const { iconAlign, iconColor, boxShadow } = styles;

  const color = iconColor === '#000' ? (darkMode ? '#fff' : '#000') : iconColor;

  /* ── Controlled reads: store is the source of truth ───────────────────── */
  const exposedOpts = { resolveIndex, moduleId };
  const visibility = useExposedVariable(id, 'isVisible', exposedOpts, properties.visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);

  const { dispatch, csaShims, useEffects } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Bucket C: exposed `click` fires onClick unconditionally (old CSA had no
  // enabled guard).
  useEffects({
    click: () => dispatch([{ kind: 'FIRE_EVENT', componentId: id, event: 'onClick' }]),
  });

  /* ── Property-change write-throughs (skip-initial) ────────────────────── */
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isVisible: properties.visibility });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isLoading: loadingState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isDisabled: disabledState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  /* ── Mount snapshot: initial exposed values + contract CSA dispatchers
     (setVisibility/setLoading/setDisable/click) ─────────────────────────── */
  useEffect(() => {
    setExposedVariables({
      isVisible: properties.visibility,
      isLoading: loadingState,
      isDisabled: disabledState,
      ...csaShims(),
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isLoading ? (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <center>
        <Loader width="16" absolute={false} />
      </center>
    </div>
  ) : (
    <div
      className={cx('icon-widget h-100', { 'd-none': !visibility }, { 'cursor-pointer': false })}
      data-cy={dataCy}
      data-disabled={isDisabled}
      style={{ textAlign: iconAlign, boxShadow }}
      onMouseEnter={(event) => {
        event.stopPropagation();
        fireEvent('onHover');
      }}
    >
      <TablerIcon
        iconName={icon}
        color={color}
        style={{
          width: height < width ? 'auto' : width,
          height: height < width ? '100%' : 'auto',
          color: iconColor,
        }}
        onClick={(event) => {
          event.stopPropagation();
          fireEvent('onClick');
        }}
        stroke={1.5}
      />
    </div>
  );
};

export default Icon;
