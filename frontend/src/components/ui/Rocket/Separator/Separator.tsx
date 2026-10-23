import React, { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import type * as SeparatorPrimitive from '@radix-ui/react-separator';

import { cn } from '@/lib/utils';
import { Separator as UntypedShadcnSeparator } from '@/components/ui/Rocket/shadcn/separator';

// shadcn/separator is untyped JS; it forwards everything to the Radix Root, so it shares its types.
const ShadcnSeparator = UntypedShadcnSeparator as typeof SeparatorPrimitive.Root;

type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

const Separator = forwardRef<ElementRef<typeof SeparatorPrimitive.Root>, SeparatorProps>(function Separator(
  { className, ...props },
  ref
) {
  return <ShadcnSeparator ref={ref} className={cn('tw-bg-border-weak', className)} {...props} />;
});

Separator.displayName = 'Separator';

export { Separator };
export type { SeparatorProps };
