'use strict';

angular.module('spa2')
  .component('spa2Comp1', {
    templateUrl: 'spa2/spa2comp1/spa2comp1.html',
    controller: function ($log) {
      $log.log('spa2comp1 loaded');
    },
  });
