import React, { useState, useEffect } from "react";
import Spinner from "@/_ui/Spinner";

export const IFrame = function IFrame({
  width,
  height,
  properties,
  styles,
  dataCy,
  setExposedVariable,
}) {
  const { source, loadingState, disabledState } = properties;
  const { boxShadow } = styles;

  const [loading, setLoading] = useState(loadingState);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [disable, setDisable] = useState(disabledState || loadingState);

  useEffect(() => {
    disable !== disabledState && setDisable(disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    visibility !== properties.visibility &&
      setVisibility(properties.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    loading !== loadingState && setLoading(loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    setExposedVariable('setLoading', async function (loading) {
      setLoading(!!loading);
      setExposedVariable('isLoading', !!loading);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    setExposedVariable('reload', async function () {
      this.contentWindow.location.reload();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setExposedVariable('setVisibility', async function (state) {
      setVisibility(!!state);
      setExposedVariable('isVisible', !!state);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    setExposedVariable('setDisable', async function (disable) {
      setDisable(!!disable);
      setExposedVariable('isDisabled', !!disable);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    setExposedVariable('isLoading', loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setExposedVariable('isDisabled', disable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disable]);

  return (
    <div
      className="tw-h-full"
      data-disabled={disable}
      style={{ display: visibility ? '' : 'none', boxShadow }}
      data-cy={dataCy}
    >
      {loading ? (
        <div
          className="tw-flex tw-items-center tw-justify-center tw-h-full"
          style={{ backgroundColor: 'var(--cc-surface1-surface)' }}
        >
          <Spinner />
        </div>
      ) : (
        <iframe
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
