import moment from 'moment';
import useStore from '@/AppBuilder/_stores/store';

export const duplicateValueMessage = (value, labels) =>
  `Duplicate option value "${value}" is used by options: ${labels
    .map((label) => `"${label}"`)
    .join(', ')}. Option values must be unique.`;

export const objectLabelMessage = (value) => `Option label of "${value}" must be text, a number, or a boolean.`;

export const logOptionProblem = ({ componentId, componentName, field, message }) => {
  const { debugger: debuggerSlice, getCurrentPageId } = useStore.getState();
  debuggerSlice.log({
    page: getCurrentPageId('canvas'),
    type: 'component',
    kind: 'component',
    key: `${componentName} - ${field}`,
    componentId,
    strace: 'page_level',
    message,
    status: true,
    error: { componentId },
    errorTarget: 'Component Property',
    logLevel: 'error',
    timestamp: moment().toISOString(),
  });
};
