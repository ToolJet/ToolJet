import { cn } from '@/lib/utils';

// Figma scrollbar: a 7px rounded interactive/hover thumb in a 10px gutter on a clear track. The 1.5px transparent
// border is what lets the 10px gutter hold a 7px thumb. ::-webkit-scrollbar only; Firefox keeps its own thin scrollbar.
// Add to any element that scrolls (`tw-overflow-y-auto`).
export const ROCKET_SCROLLBAR = cn(
  '[&::-webkit-scrollbar]:tw-w-[10px] [&::-webkit-scrollbar-track]:tw-bg-transparent',
  '[&::-webkit-scrollbar-thumb]:tw-rounded-full [&::-webkit-scrollbar-thumb]:tw-bg-interactive-hover',
  '[&::-webkit-scrollbar-thumb]:tw-border-[1.5px] [&::-webkit-scrollbar-thumb]:tw-border-solid',
  '[&::-webkit-scrollbar-thumb]:tw-border-transparent [&::-webkit-scrollbar-thumb]:[background-clip:padding-box]'
);
