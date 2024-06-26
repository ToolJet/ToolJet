import React, { Profiler } from 'react';

export const withProfiler = (WrappedComponent) => (props) => {
  function onRenderCallback(id, phase, actualDuration, baseDuration, startTime, commitTime) {
    const markName = `⚛ ${id} (${phase})`;
    performance.measure(markName, {
      end: commitTime,
      start: startTime,
    });
    performance.clearMeasures(markName);
  }

  return (
    <Profiler id={WrappedComponent.name} onRender={onRenderCallback}>
      <WrappedComponent {...props} />
    </Profiler>
  );
};
