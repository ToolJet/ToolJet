import React, { useState, useEffect, useRef } from 'react';
import { loadIcon } from '@/_helpers/iconLoader';
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
  const { iconAlign, iconColor, boxShadow } = styles;

  // Dynamic icon loading state
  const [IconElement, setIconElement] = useState(null);
  const [isIconLoading, setIsIconLoading] = useState(true);

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

  // Load icon dynamically
  useEffect(() => {
    if (!icon) {
      setIconElement(null);
      setIsIconLoading(false);
      return;
    }

    let mounted = true;
    setIsIconLoading(true);

    loadIcon(icon)
      .then((component) => {
        if (mounted) {
          setIconElement(() => component);
          setIsIconLoading(false);
        }
      })
      .catch((error) => {
        console.error('[Icon Widget] Failed to load icon:', icon, error);
        if (mounted) {
          setIconElement(null);
          setIsIconLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [icon]);

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

  // Show loader if widget is loading OR icon is loading
  if (isLoading || isIconLoading) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <center>
          <Loader width="16" absolute={false} />
        </center>
      </div>
    );
  }

  // Don't render if icon failed to load
  if (!IconElement) {
    return null;
  }

  return (
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
      <IconElement
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
