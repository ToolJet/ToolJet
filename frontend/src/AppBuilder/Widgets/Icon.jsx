import React, { useState, useEffect, useRef } from 'react';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import cx from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const Icon = ({
  id,
  properties,
  styles,
  fireEvent,
  height,
  width,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  dataCy,
}) => {
  const isInitialRender = useRef(true);
  const { icon, loadingState, disabledState } = properties;
  const { iconAlign, iconColor, boxShadow } = styles;

  const color = iconColor === '#000' ? (darkMode ? '#fff' : '#000') : iconColor;
  const { moduleId } = useModuleContext();
  // Pointer affordance only when the builder wired an onClick event (restores the pre-Sprint-19 rule).
  const hasClickEvent = useStore((state) =>
    (state.eventsSlice.getEventsByComponentsId(id, moduleId) ?? []).some(
      (event) => event?.event?.eventId === 'onClick' && !event?.event?.disabled
    )
  );

  const [visibility, setVisibility] = useState(properties.visibility);
  const [isLoading, setLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isLoading !== loadingState) setLoading(loadingState);
    if (isDisabled !== disabledState) setIsDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, loadingState, disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
  }, [disabledState]);

  useEffect(() => {
    const exposedVariables = {
      isVisible: properties.visibility,
      isLoading: loadingState,
      isDisabled: disabledState,
      click: async function () {
        fireEvent('onClick');
      },
      setVisibility: async function (value) {
        setExposedVariable('isVisible', !!value);
        setVisibility(!!value);
      },
      setLoading: async function (value) {
        setExposedVariable('isLoading', !!value);
        setLoading(!!value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', !!value);
        setIsDisabled(!!value);
      },
    };
    setExposedVariables(exposedVariables);
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
      className={cx('icon-widget h-100', { 'd-none': !visibility }, { 'cursor-pointer': hasClickEvent })}
      data-cy={dataCy}
      data-disabled={isDisabled}
      style={{
        textAlign: iconAlign,
        // Flex so the SVG is centred vertically in tall slots too; text-align alone only placed it horizontally.
        display: 'flex',
        alignItems: 'center',
        justifyContent: iconAlign === 'left' ? 'flex-start' : iconAlign === 'right' ? 'flex-end' : 'center',
        boxShadow,
      }}
      onMouseEnter={(event) => {
        event.stopPropagation();
        fireEvent('onHover');
      }}
      // Click target is the whole box (same node as the pointer cursor and onHover), not just the SVG.
      onClick={(event) => {
        event.stopPropagation();
        fireEvent('onClick');
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
        stroke={1.5}
      />
    </div>
  );
};

export default Icon;
