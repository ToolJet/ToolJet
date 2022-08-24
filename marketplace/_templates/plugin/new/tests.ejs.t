---
to: <%= plugins_path %>/plugins/<%= name %>/__tests__/index.js
---
'use strict';

const <%= name %> = require('../lib');

describe('<%= name %>', () => {
    it.todo('needs tests');
});
