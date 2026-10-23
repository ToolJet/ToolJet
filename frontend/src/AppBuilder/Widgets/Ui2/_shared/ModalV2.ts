import type { ComponentType } from 'react';
import { ModalV2 as ModalV2Js } from '@/AppBuilder/Widgets/ModalV2/ModalV2';
import type { WidgetProps } from './types';

/** What ModalV2 reads: a widget's props, plus three RenderWidget passes that WidgetProps leaves out. */
export interface ModalV2Props extends WidgetProps {
  component?: unknown;
  componentCount?: number;
  tooltipProps?: unknown;
}

// ModalV2.jsx is JavaScript, so TypeScript reads every prop it destructures as required: this gives them a type.
export const ModalV2 = ModalV2Js as ComponentType<ModalV2Props>;
