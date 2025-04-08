import React, { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line import/no-unresolved
import * as Icons from '@tabler/icons-react';
import cx from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';

export const Icon = ({
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
  const { iconAlign, iconColor } = styles;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[icon];

  const color = iconColor === '#000' ? (darkMode ? '#fff' : '#000') : iconColor;

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
        setExposedVariable('isVisible', value);
        setVisibility(value);
      },
      setLoading: async function (value) {
        setExposedVariable('isLoading', value);
        setLoading(value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', value);
        setIsDisabled(value);
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
      className={cx('icon-widget', { 'd-none': !visibility }, { 'cursor-pointer': false })}
      data-cy={dataCy}
      data-disabled={isDisabled}
      style={{ textAlign: iconAlign }}
      onMouseEnter={(event) => {
        event.stopPropagation();
        fireEvent('onHover');
      }}
    >
      <IconElement
        color={color}
        style={{
          width: height < width ? 'auto' : width,
          height: height < width ? height : 'auto',
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
