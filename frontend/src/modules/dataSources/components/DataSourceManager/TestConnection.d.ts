// Types for TestConnection.jsx, which TS infers with every destructured prop required.
// Delete this file once TestConnection is converted to TypeScript.
import type { ReactElement, ReactNode } from 'react';

import type { DataSourceTestConnectionProps } from './DataSourceManager';

export interface TestConnectionProps extends Partial<DataSourceTestConnectionProps> {
  /** Replaces the default button; receives the click handler and whether a test is running. */
  renderTrigger?: (trigger: { onClick: () => void; isTesting: boolean }) => ReactNode;
}

export declare function TestConnection(props: TestConnectionProps): ReactElement;
