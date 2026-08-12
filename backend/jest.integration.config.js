/** @type {import('jest').Config} */
module.exports = {
  ...require('../jest.config.base.js'),
  rootDir: 'src',
  testRegex: '.*\\.integration\\.spec\\.ts$',
};
