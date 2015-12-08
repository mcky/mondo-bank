;'use strict'

module.exports = function (wallaby) {
  return {
    files: [{
      pattern: 'lib/mondo.js',
      load: false
    }, {
      pattern: 'package.json',
      load: false
    }, {
      pattern: 'api.config.json',
      load: false
    }],
    tests: [
      'spec/**/*unit.spec.js'
    ],
    env: {
      type: 'node'
    },
    testFramework: 'jasmine'
  }
}
