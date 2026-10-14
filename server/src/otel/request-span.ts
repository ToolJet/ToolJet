import { Attributes, context, trace } from '@opentelemetry/api';
import { RPCType, getRPCMetadata } from '@opentelemetry/core';

// HTTP SERVER span, not the Nest span under it: route-level TraceQL filters live there.
export function setRequestSpanAttributes(attributes: Attributes): void {
  const rpc = getRPCMetadata(context.active());
  const span = rpc?.type === RPCType.HTTP && rpc.span ? rpc.span : trace.getActiveSpan();
  span?.setAttributes(attributes);
}
