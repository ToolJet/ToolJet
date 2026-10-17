// The class-name helper every pack primitive and widget uses: ToolJet's cn (classnames plus tailwind-merge set up for
// the `tw-` prefix and the `ui2` keys), typed: that module is JavaScript.
import type { ClassValue } from 'clsx';
import { cn as tjCn } from '@/lib/utils';

export const cn = tjCn as (...inputs: ClassValue[]) => string;
