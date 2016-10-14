angular.module('module1', ['ENV']);

angular.module('module1').config(function ($log, ENV) {
    $log.log('module1 loaded', ENV);
});

angular.module('module1').run(function () {

});

