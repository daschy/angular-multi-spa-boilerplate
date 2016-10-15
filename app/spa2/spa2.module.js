'use strict';

angular.module('spa2', ['ENV', 'module1']);

angular.module('spa2').config(function ($logProvider) {
  $logProvider.debugEnabled(true);
});

angular.module('spa2').run(function () {

});

