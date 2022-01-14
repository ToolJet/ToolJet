---
to: <%= plugins_path %>/packages/<%= name %>/__tests_/index.js
---
'use strict';

const <%= name %> = require('../lib');

describe('<%= name %>', () => {
    it.todo('needs tests');
});