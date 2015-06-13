'use strict'

srv      = null
messages = null

describe 'MessagesAPIService', ->
  beforeEach inject (MessagesAPIService) ->
    srv = MessagesAPIService

  it 'should have a query method', ->
    expect(srv.query).to.be.isFunction

  describe 'MessagesAPIService.query', ->
    beforeEach inject ($httpBackend) ->
      params =
        workId: '123'

      srv.query(params).$promise.then (response) ->
        messages = response

      $httpBackend.flush()

    it 'should have at some results', ->
      expect(messages.length).to.be.ok
