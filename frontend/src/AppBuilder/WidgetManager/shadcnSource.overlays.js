// shadcn/ui pack (experiment): the Dialog. It is ToolJet's ModalV2 (same slots, canvases, open/close actions, show,
// events and inspector) drawn in the pack's look, with a side-sheet kind; ModalV2's special cases cover it through
// isModalType (AppCanvas/appCanvasConstants.js). Its default header and footer children are pack widgets.
import { modalV2Config } from './widgets/modalV2.js';
import { choice } from './shadcnPackHelpers.js';

const base = modalV2Config;

export const shadDialogConfig = {
  ...base,
  name: 'ShadDialog',
  displayName: 'Dialog',
  description:
    'shadcn/ui dialog or side sheet (ToolJet Modal in the pack look): header, body and footer canvases (put a ShadHeading and a muted ShadText in the header, the form in the body, ShadButtons in the footer); open and close it with the show-modal / close-modal event actions or its open and close actions; exposed show. Kind "sheet" slides in from the side at full height',
  component: 'ShadDialog',
  properties: {
    ...base.properties,
    variant: choice('Kind', ['dialog', 'sheet'], 'dialog', { dialog: 'Dialog', sheet: 'Side sheet' }),
    side: choice('Sheet side', ['right', 'left'], 'right'),
  },
  defaultChildren: [
    {
      componentName: 'ShadHeading',
      slotName: 'header',
      layout: { top: 12, left: 1, height: 32 },
      displayName: 'DialogTitle',
      properties: ['text', 'level'],
      defaultValue: { text: 'Dialog title', level: 'h4' },
    },
    {
      componentName: 'ShadText',
      slotName: 'header',
      layout: { top: 44, left: 1, height: 24 },
      displayName: 'DialogDescription',
      properties: ['text', 'tone'],
      defaultValue: { text: 'Describe what this dialog is for.', tone: 'muted' },
    },
    {
      componentName: 'ShadButton',
      slotName: 'footer',
      layout: { top: 16, left: 26, height: 36 },
      displayName: 'DialogCancel',
      properties: ['text', 'variant'],
      defaultValue: { text: 'Cancel', variant: 'outline' },
    },
    {
      componentName: 'ShadButton',
      slotName: 'footer',
      layout: { top: 16, left: 34, height: 36 },
      displayName: 'DialogConfirm',
      properties: ['text'],
      defaultValue: { text: 'Save' },
    },
  ],
  definition: {
    ...base.definition,
    properties: {
      ...base.definition.properties,
      variant: { value: 'dialog' },
      side: { value: 'right' },
      triggerButtonLabel: { value: 'Open dialog' },
      headerHeight: { value: 80 },
      footerHeight: { value: 68 },
    },
    styles: {
      ...base.definition.styles,
      // The pack's dialog has no header or footer rules: one surface, spacing does the separating.
      headerDividerColor: { value: '#00000000' },
      footerDividerColor: { value: '#00000000' },
    },
  },
};
