import React, { useMemo, useState, useEffect } from 'react';
import { Container as ContainerComponent } from '@/AppBuilder/AppCanvas/Container';
import Spinner from '@/_ui/Spinner';

export const Container = ({
  id,
  properties,
  styles,
  darkMode,
  height,
  width,
  setExposedVariables,
  setExposedVariable,
}) => {
  const { disabledState, borderRadius, borderColor, boxShadow } = styles;

  const [isDisabled, setDisable] = useState(disabledState || properties.loadingState);
  const [isVisible, setVisibility] = useState(properties.visible);
  const [isLoading, setLoading] = useState(properties.loadingState);

  useEffect(() => {
    isDisabled !== disabledState && setDisable(disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    isVisible !== properties.visible && setVisibility(properties.visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visible]);

  useEffect(() => {
    isLoading !== properties.loadingState && setLoading(properties.loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.loadingState]);

  const exposedVariables = {
    setDisable: async (value) => setDisable(value),
    setVisibility: async (value) => setVisibility(value),
    setLoading: async (value) => setLoading(value),
  };

  useEffect(() => {
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled]);

  useEffect(() => {
    setExposedVariable('setLoading', async function (loading) {
      setLoading(loading);
      setExposedVariable('isLoading', loading);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.loadingState]);

  useEffect(() => {
    setExposedVariable('setVisibility', async function (state) {
      setVisibility(state);
      setExposedVariable('isVisible', state);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visible]);

  useEffect(() => {
    setExposedVariable('setDisable', async function (disable) {
      setDisable(disable);
      setExposedVariable('isDisabled', disable);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    setExposedVariable('isLoading', isLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    setExposedVariable('isVisible', isVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  useEffect(() => {
    setExposedVariable('isDisabled', isDisabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled]);

  const bgColor = useMemo(() => {
    return {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor,
    };
  }, [styles.backgroundColor, darkMode]);

  const computedStyles = {
    backgroundColor: bgColor.backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `1px solid ${borderColor}`,
    height,
    display: isVisible ? 'flex' : 'none',
    overflow: 'hidden auto',
    position: 'relative',
    boxShadow,
  };
  return (
    <div
      className={`jet-container ${isLoading && 'jet-container-loading'}`}
      id={id}
      data-disabled={isDisabled}
      style={computedStyles}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <ContainerComponent id={id} styles={bgColor} canvasHeight={height} canvasWidth={width} darkMode={darkMode} />
      )}
    </div>
  );
};
