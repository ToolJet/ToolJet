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
import { getCssVarValue, getModifiedColor } from './utils';

var tinycolor = require('tinycolor2');

export default function Chart({
  width: gridWidth,
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
  // The box the chart is drawn in can be narrower than its grid width: in a flex container (a card in a row of two) the
  // slot was 553px and the plot was drawn at 563, its right edge cut off by the card. The chart follows the
  // box it is given, never wider than its grid width.
  const boxRef = useRef(null);
  const [slotWidth, setSlotWidth] = useState(0);
  useEffect(() => {
    const slot = boxRef.current?.parentElement;
    if (!slot || typeof ResizeObserver === 'undefined') return undefined;
    // Narrowed only when the chart overflows its slot, and widened again as the slot grows: a slot that takes its
    // content's width never overflows, so it is never narrowed.
    const measure = () => {
      const room = Math.round(slot.clientWidth);
      const box = boxRef.current?.offsetWidth ?? 0;
      setSlotWidth((limit) => (box > room + 1 ? room : limit && room > limit ? room : limit));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    return () => observer.disconnect();
  }, []);
  const width = slotWidth > 40 && slotWidth < gridWidth ? slotWidth : gridWidth;
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

  const chartLayout = isDescriptionJson ? JSON.parse(jsonData).layout ?? {} : {};

  const updatedBgColor = ['#fff', '#ffffff'].includes(modifiedBackgroundColor)
    ? darkMode
      ? '#1f2936'
      : '#fff'
    : modifiedBackgroundColor;

  const fontColor = getColor(updatedBgColor);

  const chartTitle = plotFromJson ? chartLayout?.title ?? title : title;
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

  const layout = {
    ...chartLayout,
    width: width - 6,
    height: height - 2,
    plot_bgcolor: updatedBgColor,
    paper_bgcolor: updatedBgColor,
    title: {
      text: chartTitle,
      font: {
        color: modifiedTextColor,
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
    xaxis: {
      showgrid: showGridLines,
      showline: true,
      color: fontColor,
      automargin: true,
      visible: showAxes,
      gridcolor: modifiedGridLines,
      linecolor: modifiedAxisColor,
      title: {
        font: {
          color: modifiedTextColor,
        },
      },
      tickfont: {
        color: modifiedTextColor,
      },
      ...chartLayout.xaxis,
    },
    yaxis: {
      showgrid: showGridLines,
      showline: true,
      color: fontColor,
      automargin: true,
      visible: showAxes,
      gridcolor: modifiedGridLines,
      linecolor: modifiedAxisColor,
      title: {
        font: {
          color: modifiedTextColor,
        },
      },
      tickfont: {
        color: modifiedTextColor,
      },
      ...chartLayout.yaxis,
    },
    // Dynamically add additional axes (xaxis2, yaxis2, yaxis3, etc.) from user layout
    ...Object.keys(chartLayout)
      .filter((key) => /^(xaxis|yaxis)\d+$/.test(key))
      .reduce((acc, key) => {
        acc[key] = {
          showgrid: showGridLines,
          showline: true,
          color: fontColor,
          automargin: true,
          visible: showAxes,
          gridcolor: modifiedGridLines,
          linecolor: modifiedAxisColor,
          title: {
            font: {
              color: modifiedTextColor,
            },
          },
          tickfont: {
            color: modifiedTextColor,
          },
          ...chartLayout[key],
        };
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
    <div ref={boxRef} class="widget-chart" data-disabled={disabledState} style={computedStyles} data-cy={dataCy}>
      {loadingState === true ? (
        <div style={{ width }} className="p-2 loader-main-container">
          <center>
            <div className="spinner-border mt-5" role="status"></div>
          </center>
        </div>
      ) : (
        <PlotComponent
          data={plotFromJson ? jsonChartData : memoizedChartData}
          layout={layout}
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
