import type { Context } from 'react';
import type { TooljetDatabaseContextValue } from './TooljetDatabaseContext';

// `context.js` builds the default from inert values, which TypeScript would take as the context's type
// (`organizationId: null`): the real shape is the provider's value.
export const TooljetDatabaseContext: Context<TooljetDatabaseContextValue>;
