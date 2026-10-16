// The class-name helper every pack primitive and widget uses: clsx, with conflicting Tailwind classes merged.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
