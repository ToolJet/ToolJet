import React from 'react';
import { ModalV2 } from '@/AppBuilder/Widgets/ModalV2/ModalV2';
import './shadcn.scss';
import './shadDialog.scss';

// shadcn/ui pack (experiment): the Dialog is ToolJet's ModalV2 drawn in the pack's look. ModalV2 reads the skin from
// the component type and adds the classes styled in shadDialog.scss; it keeps its own control state, open/close
// actions and canvases.
export const ShadDialog = (props) => <ModalV2 {...props} />;
