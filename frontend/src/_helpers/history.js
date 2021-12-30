import { createBrowserHistory } from 'history';

// using force refresh as a temporary fix for improper rendering, need to figure out what's going wrong
export const history = createBrowserHistory({ forceRefresh: true });
