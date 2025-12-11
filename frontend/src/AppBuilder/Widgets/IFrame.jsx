import React, { useState, useEffect } from "react";
import Spinner from "@/_ui/Spinner";
import { useBatchedUpdateEffectArray } from "@/_hooks/useBatchedUpdateEffectArray";

export const IFrame = function IFrame({
  width,
  height,
  properties,
  styles,
  dataCy,
  setExposedVariable,
  setExposedVariables,
}) {
  const { source, loadingState, disabledState, visibility } = properties;
  const { boxShadow } = styles;
  const iframeRef = React.useRef(null);

  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] =
    useState({
      isLoading: loadingState,
      isDisabled: disabledState,
      isVisible: visibility,
    });

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  useEffect(() => {
    const exposedVariables = {
      isLoading: loadingState,
      isDisabled: disabledState,
      isVisible: visibility,
      setLoading: async function (newValue) {
        setExposedVariable("isLoading", newValue);
        updateExposedVariablesState("isLoading", newValue);
      },
      setDisabled: async function (newValue) {
        setExposedVariable("isDisabled", newValue);
        updateExposedVariablesState("isDisabled", newValue);
      },
      setVisibility: async function (newValue) {
        setExposedVariable("isVisible", newValue);
        updateExposedVariablesState("isVisible", newValue);
      },
      reload: async function () {
        const currentSrc = iframeRef.current.getAttribute("src");
        iframeRef.current.setAttribute("src", currentSrc);
      },
    };

    setExposedVariables(exposedVariables);
  }, []);

  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => {
        setExposedVariable("isLoading", loadingState);
        updateExposedVariablesState("isLoading", loadingState);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        setExposedVariable("isDisabled", disabledState);
        updateExposedVariablesState("isDisabled", disabledState);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        setExposedVariable("isVisible", visibility);
        updateExposedVariablesState("isVisible", visibility);
      },
    },
  ]);

  return (
    <div
      className="tw-h-full"
      data-disabled={exposedVariablesTemporaryState.isDisabled}
      style={{
        display: exposedVariablesTemporaryState.isVisible ? "" : "none",
        boxShadow,
      }}
      data-cy={dataCy}
    >
      {exposedVariablesTemporaryState.isLoading ? (
        <div
          className="tw-flex tw-items-center tw-justify-center tw-h-full"
          style={{ backgroundColor: "var(--cc-surface1-surface)" }}
        >
          <Spinner />
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          width={width - 4}
          height={height}
          src={source}
          title="IFrame Widget"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};
