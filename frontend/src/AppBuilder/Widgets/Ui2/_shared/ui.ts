// The primitives the UI 2.0 widgets draw with: shadcn/ui's component source, kept close to upstream. Classes compile
// through shadcn.tailwind.config.js and only apply inside `.tj-shadcn`. Radix portals render into the pack's portal
// root, which carries that class. They live in ui/ by kind; this is the one import path the widgets use.
export { cn } from './ui/cn';
export { Truncate } from './ui/truncate';
export * from './ui/controls';
export * from './ui/overlays';
export * from './ui/display';
