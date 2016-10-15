'use strict';

angular.module('module1', ['ENV']);

angular.module('module1').config(function () {

});

angular.module('module1').run(function ($log, ENV) {
  $log.log('module1 loaded', ENV);
});

