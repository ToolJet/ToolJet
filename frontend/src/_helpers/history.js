import { createBrowserHistory } from 'history';

export const history = createBrowserHistory({
  basename: window.public_config?.SUB_PATH || '/',
});
