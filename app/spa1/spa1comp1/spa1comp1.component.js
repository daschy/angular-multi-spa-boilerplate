angular.module('spa1')
 .component('spa1Comp1', {

  templateUrl: 'spa1/spa1comp1/spa1comp1.html',
  controller: function ($log) {
   $log.log('spa1comp1 loaded');
  },
 });
