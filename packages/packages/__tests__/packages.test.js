'use strict';

const packages = require('..');
const assert = require('assert').strict;

assert.strictEqual(packages(), 'Hello from packages');
console.info('packages tests passed');
