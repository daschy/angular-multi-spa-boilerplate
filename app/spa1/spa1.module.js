angular.module('spa1', ['ENV', 'module1']);

angular.module('spa1').config(function ($log, ENV) {
    $log.log('spa1 loaded', ENV);
});

angular.module('spa1').run(function () {

});

