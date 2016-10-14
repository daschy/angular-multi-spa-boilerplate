
'use strict';

angular.module('ENV', [])
  .constant('ENV', {
    name: /* @ifdef name */ '/* @echo name */' || /* @endif */ 'default',
  });