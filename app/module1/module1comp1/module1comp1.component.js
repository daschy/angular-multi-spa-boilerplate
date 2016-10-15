'use strict';

angular.module('module1')
  .component('module1Comp1', {

    templateUrl: 'module1/module1comp1/module1comp1.html',
    controller: function ($log) {
      $log.log('module1comp1 loaded');
    },
  });
