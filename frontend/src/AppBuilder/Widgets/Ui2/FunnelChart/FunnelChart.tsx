import React from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { formatter } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { funnelStages, type FunnelStage } from './funnelModel';
import {
  ChartBoundary,
  EmptyChart,
  animated,
  useClickedDatum,
  valueFormat,
} from '@/AppBuilder/Widgets/Ui2/_charts/chartParts';

// ---- Funnel --------------------------------------------------------------------------------------------------------

/** Stages as centred (or left-aligned) bars, widest first, with each stage's value and its conversion from the stage
 *  before (or from the first). Plain HTML rather than an SVG: labels never clip, and the bars follow the theme. */
export const ShadFunnelChart = (props: WidgetProps) => {
  const p = props.properties;
  const { setExposedVariables, height } = props;
  const click = useClickedDatum(props);
  useExposed(setExposedVariables, p, click.exposed);
  const stages = funnelStages(p.data, p.stageField, p.valueField).slice(0, 24);
  const format = formatter(valueFormat(p), p.yAxisFormat === 'compact');
  const base = p.conversionBase === 'first' ? 'ofFirst' : 'ofPrevious';
  const centred = p.align !== 'left';
  const showConversion = p.showConversion !== false;
  const byStage = p.colorByStage === true;
  const fade = (i: number) => (stages.length > 1 ? 1 - (i / (stages.length - 1)) * 0.45 : 1);
  const onStage = (stage: FunnelStage) => click.pick(stage.row);
  const labelWidth = Math.min(180, Math.max(56, Math.max(0, ...stages.map((s) => String(s.label).length)) * 7 + 12));
  const valueWidth =
    Math.max(40, Math.max(0, ...stages.map((s) => String(format(s.value)).length)) * 7.5 + 4) +
    (showConversion ? 52 : 0);
  const empty = !stages.length || stages.every((s) => s.value === null);
  const emptyView = <EmptyChart text={String(p.emptyText || 'No data')} />;
  return (
    <Shell {...props}>
      <div style={{ height }} className="tw-w-full tw-overflow-hidden tw-text-xs" onDoubleClick={click.onDoubleClick}>
        {empty ? (
          emptyView
        ) : (
          <ChartBoundary resetKey={p} fallback={emptyView}>
            <div className="tw-flex tw-h-full tw-flex-col tw-justify-center tw-gap-1.5 tw-py-1">
              {stages.map((stage, i) => {
                const conversion = i > 0 ? stage[base] : null;
                return (
                  <button
                    type="button"
                    key={`${stage.label}-${i}`}
                    onClick={() => onStage(stage)}
                    className="tw-group tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-items-center tw-gap-3 tw-rounded-ui2-md tw-text-left tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[color:var(--sc-ring)]"
                    style={{ maxHeight: 52 }}
                  >
                    <span
                      className="tw-shrink-0 tw-truncate tw-text-[13px] tw-text-[color:var(--lk-axis,var(--sc-muted-foreground))]"
                      style={{ width: labelWidth }}
                      title={String(stage.label)}
                    >
                      {String(stage.label)}
                    </span>
                    <span
                      className={cn(
                        'tw-flex tw-h-full tw-min-w-0 tw-flex-1 tw-items-center',
                        centred ? 'tw-justify-center' : 'tw-justify-start'
                      )}
                    >
                      <span
                        className="tw-h-full tw-min-h-[10px] tw-rounded-[6px] tw-transition-opacity group-hover:tw-opacity-90"
                        style={{
                          // A late stage of a steep funnel (764 of 16,100) still reads as a bar, not a hairline.
                          width: `${stage.value ? Math.max(6, stage.width * 100) : 0}%`,
                          background: byStage ? seriesColor(p.colors, i) : seriesColor(p.colors, 0),
                          opacity: byStage ? 1 : fade(i),
                          // Animate: each bar grows in from its anchor, a stage after the one above it.
                          ...(animated(p)
                            ? {
                                animation: `tj-funnel-grow 600ms ease-out ${i * 60}ms both`,
                                transformOrigin: centred ? 'center' : 'left',
                              }
                            : {}),
                        }}
                      />
                    </span>
                    <span
                      className="tw-flex tw-shrink-0 tw-items-baseline tw-justify-end tw-gap-2 tw-tabular-nums"
                      style={{ width: valueWidth }}
                    >
                      <span className="tw-text-[13px] tw-font-medium tw-text-[color:var(--sc-foreground)]">
                        {format(stage.value)}
                      </span>
                      {showConversion ? (
                        <span className="tw-w-[44px] tw-text-right tw-text-[color:var(--sc-muted-foreground)]">
                          {conversion === null ? '' : `${conversion}%`}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </ChartBoundary>
        )}
      </div>
    </Shell>
  );
};

export default withControlState(ShadFunnelChart);
