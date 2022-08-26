import { createBrowserHistory } from 'history';

export const history = createBrowserHistory({
  basename: __webpack_public_path__,
});
