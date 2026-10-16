// The primitives the UI 2.0 widgets draw with: shadcn/ui's component source, kept close to upstream, on ToolJet's
// Tailwind (`tw-` prefix, `ui2` theme keys). Radix portals render into the pack's portal root, which carries
// `.tj-shadcn` and so the theme tokens. They live in ui/ by kind; this is the one import path the widgets use.
export { cn } from './ui/cn';
export { Truncate } from './ui/truncate';
export * from './ui/controls';
export * from './ui/overlays';
export * from './ui/display';
