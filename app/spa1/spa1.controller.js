'use strict';

angular.module('spa1').controller('Spa1Ctrl', Spa1Ctrl);

Spa1Ctrl.$inject = ['$log'];
function Spa1Ctrl($log) {
  $log.log('Spa1Ctrl loaded');
}
