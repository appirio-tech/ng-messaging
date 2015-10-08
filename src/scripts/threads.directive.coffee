'use strict'

directive = ->
  restrict    : 'E'
  templateUrl : 'views/threads.directive.html'
  controller  : 'ThreadsController'
  controllerAs: 'vm'
  scope       :
    subscriberId: '@subscriberId'

directive.$inject = []

angular.module('appirio-tech-ng-messaging').directive 'threads', directive
