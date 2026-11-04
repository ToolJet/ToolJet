---
to: <%= name %>/src/components/ui/chart.tsx
---
import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '../../lib/utils';

/*
  shadcn/ui's chart wrapper (MIT, Copyright (c) 2023 shadcn), adapted to this template. Colours become CSS variables on
  the container rather than an injected stylesheet (a code page's policy may refuse one, and the security scan refuses raw
  HTML), and they are theme tokens, which already follow dark mode, so there is no per-theme colour option.

  ChartContainer also sets two things on the series inside it, so a chart needs neither:
  - Motion: Recharts animates in JavaScript, which the reduced-motion rule in styles/globals.css does not reach. Animation
    is on by default, and off under prefers-reduced-motion or past MAX_ANIMATED_POINTS.
  - Colour: a Bar, Line or Area with no colour of its own takes var(--color-<dataKey>) from the config, else the app's accent
    for the first series and the theme's chart hues for the rest.
*/

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

export const MAX_ANIMATED_POINTS = 300;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const subscribeToMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
/** For motion a chart drives itself; a series inside ChartContainer already follows this. */
export const usePrefersReducedMotion = () =>
  React.useSyncExternalStore(subscribeToMotion, () => window.matchMedia(REDUCED_MOTION).matches);

// By name, so a chart bundles only the series it uses.
const ANIMATED_SERIES = new Set(['Area', 'Bar', 'Funnel', 'Line', 'Pie', 'Radar', 'RadialBar', 'Scatter']);
const seriesName = (child: React.ReactNode): string | undefined => {
  if (!React.isValidElement(child) || typeof child.type === 'string') return undefined;
  const name = (child.type as { displayName?: string }).displayName;
  return name && ANIMATED_SERIES.has(name) ? name : undefined;
};
// Recharts' own default stroke and fill, already on a series' props when the chart set none.
const RECHARTS_DEFAULT_COLOUR = '#3182bd';
const colourless = (value: unknown) => value === undefined || value === RECHARTS_DEFAULT_COLOUR;

const flattenChildren = (children: React.ReactNode): React.ReactNode[] =>
  React.Children.toArray(children).flatMap((child) =>
    React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment
      ? flattenChildren(child.props.children)
      : [child]
  );

const withSeriesDefaults = (chart: React.ReactElement, config: ChartConfig, reducedMotion: boolean) => {
  const children = flattenChildren(chart.props.children);
  const series = children.filter(
    (child) => seriesName(child)
  ) as React.ReactElement[];
  const points = series.reduce((sum, { props }) => sum + (props.data ?? chart.props.data ?? []).length, 0);
  const animate = !reducedMotion && points <= MAX_ANIMATED_POINTS;
  let index = 0;
  return React.cloneElement(
    chart,
    undefined,
    children.map((child) => {
      const name = seriesName(child);
      if (!name || !React.isValidElement(child)) return child;
      const { dataKey, fill, stroke, isAnimationActive } = child.props as Record<string, any>;
      const key = String(dataKey);
      const colour = config[key]?.color
        ? `var(--color-${key})`
        : index === 0
        ? 'var(--primary)'
        : `var(--chart-${(index % 5) + 1})`;
      index += 1;
      const props: Record<string, unknown> = { isAnimationActive: isAnimationActive !== false && animate };
      if (name === 'Bar' || name === 'Area') {
        if (colourless(fill)) props.fill = colour;
      }
      if (name === 'Line' || name === 'Area') {
        if (colourless(stroke)) props.stroke = colour;
      }
      return React.cloneElement(child, props);
    })
  );
};

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ReactElement;
  }
>(({ id, className, children, config, style, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;
  const reducedMotion = usePrefersReducedMotion();
  const colours = Object.fromEntries(
    Object.entries(config).flatMap(([key, { color }]) => (color ? [[`--color-${key}`, color]] : []))
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        style={{ ...colours, ...style } as React.CSSProperties}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {withSeriesDefaults(children, config, reducedMotion)}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'Chart';

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<'div'> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: 'line' | 'dot' | 'dashed';
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item?.dataKey || item?.name || 'value'}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === 'string'
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return <div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>;
      }

      if (!value) {
        return null;
      }

      return <div className={cn('font-medium', labelClassName)}>{value}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== 'dot';

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload
            .filter((item) => item.type !== 'none')
            .map((item, index) => {
              const key = `${nameKey || item.name || item.dataKey || 'value'}`;
              const itemConfig = getPayloadConfigFromPayload(config, item, key);
              const indicatorColor = color || item.payload.fill || item.color;

              return (
                <div
                  key={item.dataKey}
                  className={cn(
                    'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                    indicator === 'dot' && 'items-center'
                  )}
                >
                  {formatter && item?.value !== undefined && item.name ? (
                    formatter(item.value, item.name, item, index, item.payload)
                  ) : (
                    <>
                      {itemConfig?.icon ? (
                        <itemConfig.icon />
                      ) : (
                        !hideIndicator && (
                          <div
                            className={cn('shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]', {
                              'h-2.5 w-2.5': indicator === 'dot',
                              'w-1': indicator === 'line',
                              'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                              'my-0.5': nestLabel && indicator === 'dashed',
                            })}
                            style={
                              {
                                '--color-bg': indicatorColor,
                                '--color-border': indicatorColor,
                              } as React.CSSProperties
                            }
                          />
                        )
                      )}
                      <div
                        className={cn(
                          'flex flex-1 justify-between leading-none',
                          nestLabel ? 'items-end' : 'items-center'
                        )}
                      >
                        <div className="grid gap-1.5">
                          {nestLabel ? tooltipLabel : null}
                          <span className="text-muted-foreground">{itemConfig?.label || item.name}</span>
                        </div>
                        {item.value && (
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {item.value.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = 'ChartTooltip';

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> &
    Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(({ className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey }, ref) => {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-center gap-4', verticalAlign === 'top' ? 'pb-3' : 'pt-3', className)}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item) => {
          const key = `${nameKey || item.dataKey || 'value'}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={item.value}
              className={cn('flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground')}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
});
ChartLegendContent.displayName = 'ChartLegend';

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const payloadPayload =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === 'string') {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config];
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };
