import React from 'react';
import { Skeleton, Spin } from 'antd';
import { ChartLoading } from '@ant-design/charts-util';
import { useIsDark } from './AntProvider';

// Ant's own loading looks for components that read ToolJet.useControlState().loading (useComponentSettings loading: 'own').
// Each keeps its content mounted underneath (hidden, or under the spinner), so typed values and scroll survive.

/** Ant's nested Spin over the content: the content stays in place, faded, with the spinner on top. `as` sizes the
 * wrapper: inline (a checkbox, a rating), block (full width: a slider, a list) or fill (the widget box). */
export const SpinOver = ({ loading, as = 'inline', children }: { loading: boolean; as?: 'inline' | 'block' | 'fill'; children: React.ReactNode }) => (
  <Spin spinning={loading} wrapperClassName={`tj-ant-spin-${as}`}>
    {children}
  </Spin>
);

/** A skeleton in the content's place while loading; the content stays mounted but hidden. */
export const SkeletonSwap = ({ loading, look, children }: { loading: boolean; look: React.ReactNode; children: React.ReactNode }) => (
  <>
    {loading ? look : null}
    <div className="tj-ant-loadable" style={loading ? { display: 'none' } : undefined}>
      {children}
    </div>
  </>
);

/** A skeleton bar in a line of text, the line kept at the text's own height: a Statistic's title, figure or trend line
 * while loading, so the loading look has the loaded one's parts and size (Ant's own Statistic loading draws one
 * paragraph, taller than the figure). `part` sets its width. */
export const TextBone = ({ part }: { part: 'title' | 'figure' | 'trend' }) => (
  <span className="tj-ant-bone-line">
    <Skeleton.Input active size="small" className={`tj-ant-bone is-${part}`} />
  </span>
);

const skeletonSize = (size?: string) => (size === 'small' ? 'small' : size === 'large' ? 'large' : 'default');

/** Skeleton.Input, block, at the control's size: the look of a text-box control (Input, pickers, Select...). rows gives
 * a TextArea's height (Ant's 22px lines plus padding). */
export const ControlSkeleton = ({ loading, size, rows, children }: { loading: boolean; size?: string; rows?: number; children: React.ReactNode }) => (
  <SkeletonSwap loading={loading} look={<Skeleton.Input active block size={skeletonSize(size)} style={rows ? { height: rows * 22 + 10 } : undefined} />}>
    {children}
  </SkeletonSwap>
);

/** A chart's own loader (@ant-design/charts' ChartLoading), on the component's surface colour. */
export const ChartLoader = () => {
  const dark = useIsDark();
  return <ChartLoading loading={{ container: { background: 'var(--ant-color-bg-container)' } }} theme={dark ? 'dark' : 'light'} />;
};

/** ChartLoader over a chart, which stays mounted underneath. */
export const ChartVeil = ({ loading, children }: { loading: boolean; children: React.ReactNode }) => (
  <div className="tj-ant-chart-veil">
    {children}
    {loading ? <ChartLoader /> : null}
  </div>
);
