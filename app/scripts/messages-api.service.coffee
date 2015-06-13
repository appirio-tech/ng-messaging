'use strict'

transformResponse = (response) ->
  parsed = JSON.parse response

  parsed?.result?.content || []

srv = ($resource, API_URL) ->
  url     = API_URL + '/messages'
  params  = filter: 'sourceObjectId%3D@workId'
  actions =
    query:
      method           :'GET'
      isArray          : true
      transformResponse: transformResponse

  $resource url, params, actions

srv.$inject = ['$resource', 'API_URL']

angular.module('appirio-tech-messaging').factory 'MessagesAPIService', srv
