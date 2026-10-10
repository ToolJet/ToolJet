import React, { useLayoutEffect, useRef, useState } from 'react';
import { Column, Bar, Line, Area, Pie, Gauge, Funnel } from '@ant-design/plots';
import { Empty } from 'antd';
import { Shell, useExposed, list } from './AntDesign';

// Ant Design pack charts (experiment, exp/antd-pack): @ant-design/plots (AntV G2) in their own lazy chunk, so only
// apps that use a chart load it. Colours and text follow the app theme like the other Ant widgets: the theme's
// primary leads the series palette, and axis and legend text use the theme's text colours.

const SERIES = ['#13A8A8', '#FAAD14', '#EB2F96', '#722ED1', '#52C41A', '#FA8C16', '#2F54EB'];

const useChartTheme = (ref, darkMode) => {
  const [t, setT] = useState(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const css = getComputedStyle(ref.current);
    const read = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
    setT({
      primary: read('--cc-primary-brand', '#1677ff'),
      text: read('--cc-primary-text', darkMode ? '#e8e8e8' : '#1f1f1f'),
      muted: read('--cc-placeholder-text', '#8c8c8c'),
      grid: read('--cc-weak-border', darkMode ? '#303030' : '#f0f0f0'),
      font: css.fontFamily,
    });
  }, [ref, darkMode]);
  return t;
};

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const formatter = (prefix, suffix, short) => (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? '');
  return `${prefix || ''}${short ? compact.format(n) : full.format(n)}${suffix || ''}`;
};

/** Options shared by every chart: palette, theme-coloured axes and legend, transparent ground, value formats. */
const baseOptions = (t, properties, height) => {
  const axisStyle = {
    labelFill: t.muted,
    labelFillOpacity: 1,
    labelFontFamily: t.font,
    titleFill: t.muted,
    gridStroke: t.grid,
    gridStrokeOpacity: 1,
    lineStroke: t.grid,
    tickStroke: t.grid,
  };
  return {
    height,
    autoFit: true,
    theme: { view: { viewFill: 'transparent' } },
    scale: { color: { range: [t.primary, ...SERIES] } },
    axis: {
      x: { ...axisStyle, title: false },
      y: {
        ...axisStyle,
        title: false,
        labelFormatter: formatter(properties.valuePrefix, properties.valueSuffix, true),
      },
    },
    legend:
      properties.showLegend === false
        ? false
        : { color: { itemLabelFill: t.text, itemLabelFontFamily: t.font, position: 'top' } },
  };
};

const ChartShell = ({ props, kind, render }) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent, darkMode, height } = props;
  const ref = useRef(null);
  const t = useChartTheme(ref, darkMode);
  const [clicked, setClicked] = useState({});
  useExposed(setExposedVariables, properties, { clickedDatum: clicked });
  const onEvent = (_chart, event) => {
    if (event?.type !== 'element:click') return;
    const datum = event?.data?.data ?? {};
    setClicked(datum);
    setExposedVariable('clickedDatum', datum);
    fireEvent('onClick');
  };
  const empty = kind !== 'gauge' && list(properties.data).length === 0;
  return (
    <Shell {...props} innerRef={ref}>
      <div style={{ height, position: 'relative' }}>
        {!t ? null : empty ? (
          <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={properties.emptyText || 'No data'} />
          </div>
        ) : (
          render(t, { onEvent, loading: !!properties.loadingState })
        )}
      </div>
    </Shell>
  );
};

const labelOption = (properties, field) =>
  properties.showLabels === true
    ? {
        label: {
          text: field,
          formatter: formatter(properties.valuePrefix, properties.valueSuffix, true),
          position: 'inside',
        },
      }
    : {};

export const AntLineChart = (props) => (
  <ChartShell
    props={props}
    kind="line"
    render={(t, common) => {
      const p = props.properties;
      const series = p.seriesField
        ? { colorField: p.seriesField }
        : { style: p.area ? { fill: t.primary, fillOpacity: 0.25 } : { stroke: t.primary, lineWidth: 2 } };
      const options = {
        ...baseOptions(t, p, props.height),
        ...common,
        data: list(p.data),
        xField: p.xField,
        yField: p.yField,
        ...series,
        ...(p.smooth === true ? { shapeField: 'smooth' } : {}),
        ...(p.area && p.stack === true && p.seriesField ? { stack: true } : {}),
        ...labelOption(p, p.yField),
        tooltip: { items: [{ channel: 'y', valueFormatter: formatter(p.valuePrefix, p.valueSuffix, false) }] },
      };
      return p.area === true ? <Area {...options} /> : <Line {...options} />;
    }}
  />
);

export const AntColumnChart = (props) => (
  <ChartShell
    props={props}
    kind="column"
    render={(t, common) => {
      const p = props.properties;
      const options = {
        ...baseOptions(t, p, props.height),
        ...common,
        data: list(p.data),
        xField: p.xField,
        yField: p.yField,
        ...(p.seriesField
          ? { colorField: p.seriesField, ...(p.stack === true ? { stack: true } : { group: true }) }
          : { style: { fill: t.primary, radiusTopLeft: 4, radiusTopRight: 4 } }),
        ...labelOption(p, p.yField),
        tooltip: { items: [{ channel: 'y', valueFormatter: formatter(p.valuePrefix, p.valueSuffix, false) }] },
      };
      return p.horizontal === true ? <Bar {...options} /> : <Column {...options} />;
    }}
  />
);

export const AntPieChart = (props) => (
  <ChartShell
    props={props}
    kind="pie"
    render={(t, common) => {
      const p = props.properties;
      const base = baseOptions(t, p, props.height);
      const donut = p.donut === true;
      return (
        <Pie
          {...base}
          {...common}
          data={list(p.data)}
          angleField={p.valueField}
          colorField={p.categoryField}
          innerRadius={donut ? 0.62 : 0}
          axis={false}
          legend={
            p.showLegend === false
              ? false
              : {
                  color: {
                    itemLabelFill: t.text,
                    itemLabelFontFamily: t.font,
                    position: 'right',
                    layout: { justifyContent: 'center' },
                  },
                }
          }
          label={
            p.showLabels === true
              ? {
                  text: p.valueField,
                  position: donut ? 'outside' : 'inside',
                  formatter: formatter(p.valuePrefix, p.valueSuffix, true),
                }
              : false
          }
          annotations={
            donut && p.centerLabel
              ? [
                  {
                    type: 'text',
                    style: {
                      text: String(p.centerLabel),
                      x: '50%',
                      y: '50%',
                      textAlign: 'center',
                      fontSize: 18,
                      fontWeight: 600,
                      fill: t.text,
                      fontFamily: t.font,
                    },
                  },
                ]
              : undefined
          }
          tooltip={{ items: [{ channel: 'y', valueFormatter: formatter(p.valuePrefix, p.valueSuffix, false) }] }}
        />
      );
    }}
  />
);

export const AntGaugeChart = (props) => (
  <ChartShell
    props={props}
    kind="gauge"
    render={(t, common) => {
      const p = props.properties;
      const max = Number(p.max) || 100;
      const value = Math.max(0, Math.min(Number(p.value) || 0, max));
      return (
        <Gauge
          {...common}
          height={props.height}
          autoFit
          theme={{ view: { viewFill: 'transparent' } }}
          data={{ target: value, total: max, name: String(p.label ?? '') }}
          legend={false}
          scale={{ color: { range: [t.primary, t.grid] } }}
          style={{
            textContent: (target) => `${full.format(target)}${p.valueSuffix || ''}`,
            textFill: t.text,
            textFontFamily: t.font,
            pointerStroke: t.muted,
            pinStroke: t.muted,
          }}
        />
      );
    }}
  />
);

export const AntFunnelChart = (props) => (
  <ChartShell
    props={props}
    kind="funnel"
    render={(t, common) => {
      const p = props.properties;
      const base = baseOptions(t, p, props.height);
      return (
        <Funnel
          {...base}
          {...common}
          data={list(p.data)}
          xField={p.xField}
          yField={p.yField}
          axis={false}
          legend={false}
          label={{
            text: (d) => `${d[p.xField]}  ${formatter(p.valuePrefix, p.valueSuffix, false)(d[p.yField])}`,
            fill: '#fff',
            fontFamily: t.font,
          }}
        />
      );
    }}
  />
);
