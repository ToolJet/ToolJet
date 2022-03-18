---
to: <%= plugins_path %>/packages/<%= name %>/__tests__/index.js
---
'use strict';

const <%= name %> = require('../lib');

describe('<%= name %>', () => {
    it.todo('needs tests');
});
