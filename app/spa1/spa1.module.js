'use strict';

angular.module('spa1', ['ENV', 'module1']);

angular.module('spa1').config(function ($logProvider) {
  $logProvider.debugEnabled(true);
});

angular.module('spa1').run(function () {

});

