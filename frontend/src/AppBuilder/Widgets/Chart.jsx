import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
// eslint-disable-next-line import/no-unresolved
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import { isStringValidJson } from '@/_helpers/utils';
const Plot = createPlotlyComponent(Plotly);
import { isEqual } from 'lodash';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getCssVarValue, getModifiedColor, buildChartAxis } from './utils';
import { applyPlotlyCompat } from './plotlyCompat';

var tinycolor = require('tinycolor2');

export default function Chart({
  width,
  height,
  darkMode,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  dataCy,
}) {
  const isInitialRender = useRef(true);
  const [loadingState, setLoadingState] = useState(false);
  const themeChanged = useStore((state) => state.themeChanged);

  const getColor = (color) => {
    if (tinycolor(color).getBrightness() > 128) return '#000';
    return '#fff';
  };

  const { padding, visibility, disabledState, boxShadow, backgroundColor, borderRadius, borderColor } = styles;
  const { title, markerColor, showGridLines, type, data, jsonDescription, plotFromJson, showAxes, barmode } =
    properties;

  const modifiedBackgroundColor = getModifiedColor(backgroundColor, 0);
  const modifiedMarkerColor = getModifiedColor(markerColor, 0);
  const modifiedGridLines = getCssVarValue(document.documentElement, 'var(--cc-weak-border)');
  const modifiedTextColor = getCssVarValue(document.documentElement, 'var(--cc-primary-text)');
  const modifiedAxisColor = getCssVarValue(document.documentElement, 'var(--cc-default-border)');
  console.log('modifiedAxisColor', modifiedAxisColor);

  useEffect(() => {
    const loadingStateProperty = properties.loadingState;
    if (loadingStateProperty != undefined) {
      setLoadingState(loadingStateProperty);
    }
  }, [properties.loadingState]);

  const computedStyles = {
    width: width - 4,
    height,
    display: visibility ? '' : 'none',
    // background: darkMode ? '#1f2936' : 'white',
    border: `1px solid ${borderColor}`,
    boxShadow,
    borderRadius,
  };
  const dataString = data ?? [];

  const chartType = type;

  const jsonData = typeof jsonDescription === 'object' ? JSON.stringify(jsonDescription) : jsonDescription;

  let isDescriptionJson = false;
  if (plotFromJson) {
    isDescriptionJson = isStringValidJson(jsonData);
    if (!isDescriptionJson) {
      console.log('Throw error');
    }
  }

  const jsonChartData = isDescriptionJson ? JSON.parse(jsonData).data : [];

  const chartLayout = isDescriptionJson ? (JSON.parse(jsonData).layout ?? {}) : {};

  const updatedBgColor = ['#fff', '#ffffff'].includes(modifiedBackgroundColor)
    ? darkMode
      ? '#1f2936'
      : '#fff'
    : modifiedBackgroundColor;

  const fontColor = getColor(updatedBgColor);

  const authorTitle = plotFromJson ? (chartLayout?.title ?? title) : title;
  // An author may write the title either way round: `title: 'Sales'` or the
  // modern `title: { text: 'Sales' }`. Passing the object straight through would
  // nest it as title.text.text, which Plotly cannot read — it falls back to its
  // placeholder and the author's title silently disappears.
  const chartTitle = typeof authorTitle === 'object' && authorTitle !== null ? authorTitle.text : authorTitle;
  useEffect(() => {
    if (isInitialRender.current) return;
    const { xaxis, yaxis } = chartLayout;
    let xAxisTitle, yAxisTitle;
    if (xaxis) {
      xAxisTitle = xaxis?.title?.text || xaxis?.title;
    }
    if (yaxis) {
      yAxisTitle = yaxis?.title?.text || yaxis?.title;
    }
    const exposedVariables = {
      chartTitle: chartTitle,
      xAxisTitle: xAxisTitle,
      yAxisTitle: yAxisTitle,
    };
    setExposedVariables(exposedVariables);
  }, [JSON.stringify(chartLayout, chartTitle)]);

  const axisDefaults = {
    showgrid: showGridLines,
    showline: true,
    color: fontColor,
    automargin: true,
    visible: showAxes,
    gridcolor: modifiedGridLines,
    linecolor: modifiedAxisColor,
    title: { font: { color: modifiedTextColor } },
    tickfont: { color: modifiedTextColor },
  };
  const buildAxis = (userAxis) => buildChartAxis(userAxis, axisDefaults);

  const layout = {
    ...chartLayout,
    width: width - 6,
    height: height - 2,
    plot_bgcolor: updatedBgColor,
    paper_bgcolor: updatedBgColor,
    title: {
      // Keep the author's other title settings (x, xanchor, pad, ...) and font,
      // rather than replacing the whole object with just our text and colour.
      ...(typeof authorTitle === 'object' && authorTitle !== null ? authorTitle : {}),
      text: chartTitle,
      font: {
        color: modifiedTextColor,
        ...(typeof authorTitle === 'object' ? authorTitle?.font : undefined),
      },
    },
    showlegend: chartLayout.showlegend ?? false,
    legend: {
      text: chartTitle,
      font: {
        color: fontColor,
      },
      ...chartLayout.legend,
    },
    xaxis: buildAxis(chartLayout.xaxis),
    yaxis: buildAxis(chartLayout.yaxis),
    // Dynamically add additional axes (xaxis2, yaxis2, yaxis3, etc.) from user layout
    ...Object.keys(chartLayout)
      .filter((key) => /^(xaxis|yaxis)\d+$/.test(key))
      .reduce((acc, key) => {
        acc[key] = buildAxis(chartLayout[key]);
        return acc;
      }, {}),
    margin: {
      l: padding,
      r: padding,
      b: padding,
      t: padding,
    },
    ...(chartLayout.annotations && { annotations: chartLayout.annotations }),
    barmode: barmode,
    hoverlabel: { namelength: -1 },
    ...('dragmode' in chartLayout && { dragmode: chartLayout.dragmode }),
  };

  const computeChartData = (data, dataString) => {
    let rawData = data;
    if (typeof rawData === 'string') {
      try {
        rawData = JSON.parse(dataString);
      } catch (err) {
        rawData = [];
      }
    }

    if (!Array.isArray(rawData)) {
      rawData = [];
    }

    let newData = [];

    if (chartType === 'pie') {
      newData = [
        {
          type: chartType,
          values: rawData.map((item) => item['y']),
          labels: rawData.map((item) => item['x']),
        },
      ];
    } else {
      newData = [
        {
          type: chartType || 'line',
          x: rawData.map((item) => item['x']),
          y: rawData.map((item) => item['y']),
          marker: { color: modifiedMarkerColor },
        },
      ];
    }

    return newData;
  };

  const memoizedChartData = useMemo(
    () => computeChartData(data, dataString),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, dataString, chartType, modifiedMarkerColor]
  );

  // Charts authored against Plotly 2.x can use syntax that Plotly 4 silently
  // ignores rather than rejects — a filter that stops filtering still renders,
  // just with the wrong rows. Rewrite the legacy syntax before Plotly sees it.
  // Only custom-JSON charts can carry it; the native modes build their own spec.
  const {
    data: plotData,
    layout: plotLayout,
    unsupported,
  } = useMemo(() => {
    if (!plotFromJson) return { data: memoizedChartData, layout, unsupported: [] };
    return applyPlotlyCompat(jsonChartData, layout, tinycolor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotFromJson, memoizedChartData, jsonChartData, layout]);

  const handleClick = useCallback((data) => {
    if (!disabledState && data.length > 0) {
      const {
        x: xAxisLabel,
        y: yAxisLabel,
        label: dataLabel,
        value: dataValue,
        percent: dataPercent,
        fullData: { name } = {},
      } = data[0];
      setExposedVariable('clickedDataPoint', {
        xAxisLabel,
        yAxisLabel,
        dataLabel,
        dataValue,
        dataPercent,
        dataSeriesName: name,
      });
      fireEvent('onClick');
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (!disabledState) {
      fireEvent('onDoubleClick');
    }
  }, []);

  useEffect(() => {
    const { xaxis, yaxis } = chartLayout;

    let xAxisTitle, yAxisTitle;
    if (xaxis) {
      xAxisTitle = xaxis?.title?.text || xaxis?.title;
    }
    if (yaxis) {
      yAxisTitle = yaxis?.title?.text || yaxis?.title;
    }
    const exposedVariables = {
      chartTitle: chartTitle,
      xAxisTitle: xAxisTitle,
      yAxisTitle: yAxisTitle,
      clearClickedPoint: () => {
        setExposedVariable('clickedDataPoint', {});
      },
    };

    setExposedVariables(exposedVariables);
    isInitialRender.current = false;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div class="widget-chart" data-disabled={disabledState} style={computedStyles} data-cy={dataCy}>
      {loadingState === true ? (
        <div style={{ width }} className="p-2 loader-main-container">
          <center>
            <div className="spinner-border mt-5" role="status"></div>
          </center>
        </div>
      ) : unsupported.length > 0 && plotData.length === 0 ? (
        // Nothing renderable survived the migration. Say so — a blank chart with
        // no explanation is worse than an unsupported-feature message.
        <div className="p-3 d-flex align-items-center justify-content-center h-100 text-muted text-center">
          <div>
            <div className="mb-1">This chart type is no longer supported.</div>
            <small>{unsupported.join('; ')}</small>
          </div>
        </div>
      ) : (
        <PlotComponent
          data={plotData}
          layout={plotLayout}
          config={{
            displayModeBar: false,
          }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          disabledState={disabledState}
        />
      )}
    </div>
  );
}

// onClick event was not working when the component is re-rendered for every click. Hance, memoization is used
const PlotComponent = memo(
  ({ data, layout, config, onClick, onDoubleClick, disabledState }) => {
    return (
      <Plot
        data={data}
        layout={deepClone(layout)} // Cloning the layout since the object is getting mutated inside the package
        config={config}
        onClick={(e) => {
          if (!disabledState) onClick(e.points);
        }}
        onDoubleClick={() => {
          if (!disabledState) onDoubleClick();
        }}
      />
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps)
);
