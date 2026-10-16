import React from 'react';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { seriesColor } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { formatter, funnelStages } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
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
export const ShadFunnelChart = (props) => {
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
  const fade = (i) => (stages.length > 1 ? 1 - (i / (stages.length - 1)) * 0.45 : 1);
  const onStage = (stage) => click.pick(stage.row);
  const labelWidth = Math.min(180, Math.max(56, Math.max(0, ...stages.map((s) => String(s.label).length)) * 7 + 12));
  const valueWidth =
    Math.max(40, Math.max(0, ...stages.map((s) => String(format(s.value)).length)) * 7.5 + 4) +
    (showConversion ? 52 : 0);
  const empty = !stages.length || stages.every((s) => s.value === null);
  const emptyView = <EmptyChart text={String(p.emptyText || 'No data')} />;
  return (
    <Shell {...props}>
      <div style={{ height }} className="w-full overflow-hidden text-xs" onDoubleClick={click.onDoubleClick}>
        {empty ? (
          emptyView
        ) : (
          <ChartBoundary resetKey={p} fallback={emptyView}>
            <div className="flex h-full flex-col justify-center gap-1.5 py-1">
              {stages.map((stage, i) => {
                const conversion = i > 0 ? stage[base] : null;
                return (
                  <button
                    type="button"
                    key={`${stage.label}-${i}`}
                    onClick={() => onStage(stage)}
                    className="group flex min-h-0 w-full flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sc-ring)]"
                    style={{ maxHeight: 52 }}
                  >
                    <span
                      className="shrink-0 truncate text-[13px] text-[color:var(--lk-axis,var(--sc-muted-foreground))]"
                      style={{ width: labelWidth }}
                      title={String(stage.label)}
                    >
                      {String(stage.label)}
                    </span>
                    <span
                      className={cn(
                        'flex h-full min-w-0 flex-1 items-center',
                        centred ? 'justify-center' : 'justify-start'
                      )}
                    >
                      <span
                        className="h-full min-h-[10px] rounded-[6px] transition-opacity group-hover:opacity-90"
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
                      className="flex shrink-0 items-baseline justify-end gap-2 tabular-nums"
                      style={{ width: valueWidth }}
                    >
                      <span className="text-[13px] font-medium text-[color:var(--sc-foreground)]">
                        {format(stage.value)}
                      </span>
                      {showConversion ? (
                        <span className="w-[44px] text-right text-[color:var(--sc-muted-foreground)]">
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
