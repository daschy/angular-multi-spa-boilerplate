(function () {
 'use strict';

 angular
  .module('public')
  .controller('Spa1Ctrl', Spa1Ctrl);

 Spa1Ctrl.$inject = ['$log'];
 function PublicController($log) {
  $log.log('Spa1Ctrl loaded');
 }
})();