'use strict';

module.exports = function (config) {
  config.set({

    basePath: '',

    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'config/env.js',
      'app/module1/{,**/}*.js',
      'app/spa1/{,**/}*.js',
      'app/spa2/{,**/}*.js',
    ],

    autoWatch: true,

    frameworks: ['mocha'],
    reporters: ['progress'], // add coverage
    colors: true,
    browsers: ['PhantomJS'],
    coverageReporter: {
      reporters: [
        { type: 'text-summary' },
        { type: 'html', dir: 'coverage/' },
      ],
    },

    preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      'app{/**,}/!(*.test).js': ['coverage'],
    },

    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit',
    },

  });
};
