(function() {
  'use strict';
  var dependencies;

  dependencies = ['ui.router', 'ngResource', 'app.constants', 'appirio-tech-ng-auth', 'angular-storage', 'angular-jwt', 'duScroll'];

  angular.module('appirio-tech-messaging', dependencies);

}).call(this);

angular.module("appirio-tech-messaging").run(["$templateCache", function($templateCache) {$templateCache.put("views/messaging.directive.html","<ul class=\"messages\"><li ng-repeat=\"message in vm.messaging.messages track by $index\"><img ng-src=\"{{ vm.messaging.avatars[message.publisherId] }}\" class=\"avatar\"/><div class=\"message\"><p>{{ message.body }}</p><ul class=\"attachments\"><li ng-repeat=\"attachment in message.attachments track by $index\"><a href=\"#\">{{ message.attachments.originalUrl }}</a></li></ul><time>{{ message.createdAt | timeLapse }}</time></div></li><a id=\"messaging-bottom-{{ vm.threadId }}\"></a></ul><form ng-submit=\"vm.sendMessage()\"><textarea placeholder=\"Send a message&hellip;\" ng-model=\"vm.newMessage\"></textarea><button type=\"submit\" class=\"enter\">Enter</button><button type=\"button\" class=\"attach\"><div class=\"icon\"></div><span>Add Attachment</span></button></form>");
$templateCache.put("views/threads.directive.html","<ul><li ng-repeat=\"thread in vm.threads track by $index\"><a ui-sref=\"messaging({ id: thread.id })\"><header><h4>{{ thread.subject }}</h4><time>{{ thread.messages[0].createdAt | timeLapse }}</time></header><main><img ng-src=\"{{ vm.avatars[thread.messages[0].publisherId] }}\" class=\"avatar\"/><div ng-show=\"thread.unreadCount &gt; 0\" class=\"notification\">{{ thread.unreadCount }}</div><div class=\"message\"><div class=\"co-pilot\">{{ thread.messages[0].publisherId }}:</div><p>{{ thread.messages[0].body }}</p></div></main></a></li></ul><div ng-show=\"vm.threads.length == 0\" class=\"none\">None</div>");}]);
(function() {
  'use strict';
  var MessagingController;

  MessagingController = function($scope, MessagingService, UserV3Service) {
    var activate, getUserMessages, onChange, sendMessage, vm;
    vm = this;
    vm.currentUser = null;
    onChange = function(messages) {
      return vm.messaging = messages;
    };
    activate = function() {
      vm.messaging = {
        messages: []
      };
      vm.newMessage = '';
      $scope.$watch('threadId', function() {
        if ($scope.threadId.length) {
          return getUserMessages($scope.threadId);
        }
      });
      vm.sendMessage = sendMessage;
      vm.getUserMessages = getUserMessages;
      return vm;
    };
    getUserMessages = function(threadId) {
      return UserV3Service.getCurrentUser(function(response) {
        var params;
        vm.currentUser = response != null ? response.id : void 0;
        params = {
          id: threadId,
          subscriberId: vm.currentUser
        };
        return MessagingService.getMessages(params, onChange);
      });
    };
    sendMessage = function() {
      var message;
      if (vm.newMessage.length) {
        message = {
          threadId: $scope.threadId,
          body: vm.newMessage,
          publisherId: vm.currentUser,
          createdAt: moment(),
          attachments: []
        };
        vm.messaging.messages.push(message);
        MessagingService.postMessage(message, onChange);
        vm.newMessage = '';
        return $scope.showLast = 'scroll';
      }
    };
    return activate();
  };

  MessagingController.$inject = ['$scope', 'MessagingService', 'UserV3Service'];

  angular.module('appirio-tech-messaging').controller('MessagingController', MessagingController);

}).call(this);

(function() {
  'use strict';
  var directive;

  directive = function(MessagingService) {
    var link;
    link = function(scope, element, attrs) {
      var showLast;
      showLast = function(newValue, oldValue) {
        var $messageList, bottom, messageList, uls;
        if (newValue) {
          scope.showLast = false;
          uls = element.find('ul');
          messageList = uls[0];
          $messageList = angular.element(messageList);
          bottom = messageList.scrollHeight;
          if (newValue === 'scroll') {
            return $messageList.scrollTopAnimated(bottom);
          } else {
            return $messageList.scrollTop(bottom);
          }
        }
      };
      showLast(true);
      return scope.$watch('showLast', showLast);
    };
    return {
      restrict: 'E',
      templateUrl: 'views/messaging.directive.html',
      link: link,
      controller: 'MessagingController',
      controllerAs: 'vm',
      scope: {
        threadId: '@threadId'
      }
    };
  };

  directive.$inject = ['MessagingService'];

  angular.module('appirio-tech-messaging').directive('messaging', directive);

}).call(this);

(function() {
  'use strict';
  var srv;

  srv = function(MessagesAPIService, AVATAR_URL, UserAPIService, ThreadsAPIService) {
    var buildAvatar, getMessages, markMessageRead, postMessage;
    getMessages = function(params, onChange) {
      var messaging, resource;
      messaging = {
        messages: [],
        avatars: {}
      };
      resource = ThreadsAPIService.get(params);
      resource.$promise.then(function(response) {
        var i, len, message, ref;
        messaging.messages = response != null ? response.messages : void 0;
        ref = messaging.messages;
        for (i = 0, len = ref.length; i < len; i++) {
          message = ref[i];
          buildAvatar(message.publisherId, messaging, onChange);
          markMessageRead(message, params);
        }
        return typeof onChange === "function" ? onChange(messaging) : void 0;
      });
      resource.$promise["catch"](function() {});
      return resource.$promise["finally"](function() {});
    };
    markMessageRead = function(message, params) {
      var putParams, queryParams;
      queryParams = {
        id: message.id
      };
      putParams = {
        read: true,
        subscriberId: params.subscriberId,
        threadId: params.id
      };
      return MessagesAPIService.put(queryParams, putParams);
    };
    buildAvatar = function(handle, messaging, onChange) {
      var params, user;
      if (!messaging.avatars[handle]) {
        params = {
          handle: handle
        };
        user = UserAPIService.get(params);
        user.$promise.then(function(response) {
          messaging.avatars[handle] = AVATAR_URL + (response != null ? response.photoLink : void 0);
          return typeof onChange === "function" ? onChange(messaging) : void 0;
        });
        user.$promise["catch"](function(response) {});
        return user.$promise["finally"](function() {});
      }
    };
    postMessage = function(message, onChange) {
      var resource;
      resource = MessagesAPIService.save(message);
      resource.$promise.then(function(response) {});
      resource.$promise["catch"](function(response) {});
      return resource.$promise["finally"](function() {});
    };
    return {
      getMessages: getMessages,
      postMessage: postMessage
    };
  };

  srv.$inject = ['MessagesAPIService', 'AVATAR_URL', 'UserAPIService', 'ThreadsAPIService'];

  angular.module('appirio-tech-messaging').factory('MessagingService', srv);

}).call(this);

(function() {
  'use strict';
  var srv, transformResponse;

  transformResponse = function(response) {
    var parsed, ref;
    parsed = JSON.parse(response);
    return (parsed != null ? (ref = parsed.result) != null ? ref.content : void 0 : void 0) || [];
  };

  srv = function($resource, API_URL) {
    var methods, params, url;
    url = API_URL + '/messages/:id';
    params = {
      id: '@id'
    };
    methods = {
      put: {
        method: 'PUT'
      }
    };
    return $resource(url, {}, methods);
  };

  srv.$inject = ['$resource', 'API_URL'];

  angular.module('appirio-tech-messaging').factory('MessagesAPIService', srv);

}).call(this);

(function() {
  'use strict';
  var directive;

  directive = function(MessagingService) {
    return {
      restrict: 'E',
      templateUrl: 'views/threads.directive.html',
      controller: 'ThreadsController',
      controllerAs: 'vm',
      scope: true
    };
  };

  directive.$inject = ['MessagingService'];

  angular.module('appirio-tech-messaging').directive('threads', directive);

}).call(this);

(function() {
  'use strict';
  var srv, transformResponse;

  transformResponse = function(response) {
    var parsed, ref;
    parsed = JSON.parse(response);
    return (parsed != null ? (ref = parsed.result) != null ? ref.content : void 0 : void 0) || {};
  };

  srv = function($resource, API_URL) {
    var actions, params, url;
    url = API_URL + '/threads/:id';
    params = {
      id: '@id',
      subscriberId: '@subscriberId'
    };
    actions = {
      query: {
        method: 'GET',
        isArray: false,
        transformResponse: transformResponse
      },
      get: {
        method: 'GET',
        isArray: false,
        transformResponse: transformResponse
      }
    };
    return $resource(url, params, actions);
  };

  srv.$inject = ['$resource', 'API_URL'];

  angular.module('appirio-tech-messaging').factory('ThreadsAPIService', srv);

}).call(this);

(function() {
  'use strict';
  var ThreadsController;

  ThreadsController = function(ThreadsService, UserV3Service) {
    var activate, onChange, removeBlanks, vm;
    vm = this;
    onChange = function(threadsVm) {
      vm.threads = removeBlanks(threadsVm.threads);
      vm.totalUnreadCount = threadsVm.totalUnreadCount;
      return vm.avatars = threadsVm.avatars;
    };
    removeBlanks = function(threads) {
      var i, len, noBlanks, thread;
      noBlanks = [];
      for (i = 0, len = threads.length; i < len; i++) {
        thread = threads[i];
        if (thread.messages.length) {
          noBlanks.push(thread);
        }
      }
      return noBlanks;
    };
    activate = function() {
      UserV3Service.getCurrentUser(function(response) {
        if (response != null ? response.id : void 0) {
          return ThreadsService.get(response.id, onChange);
        }
      });
      return vm;
    };
    return activate();
  };

  ThreadsController.$inject = ['ThreadsService', 'UserV3Service'];

  angular.module('appirio-tech-messaging').controller('ThreadsController', ThreadsController);

}).call(this);

(function() {
  'use strict';
  var srv;

  srv = function(ThreadsAPIService, AVATAR_URL, UserAPIService) {
    var buildAvatar, get;
    get = function(subscriberId, onChange) {
      var queryParams, resource, threadsVm;
      queryParams = {
        subscriberId: subscriberId
      };
      threadsVm = {
        threads: [],
        totalUnreadCount: {},
        avatars: {}
      };
      resource = ThreadsAPIService.query(queryParams);
      resource.$promise.then(function(response) {
        var i, j, k, len, len1, len2, message, publisher, publishers, ref, ref1, thread;
        threadsVm.threads = response.threads;
        publishers = [];
        ref = threadsVm.threads;
        for (i = 0, len = ref.length; i < len; i++) {
          thread = ref[i];
          ref1 = thread.messages;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            message = ref1[j];
            publishers.push(message.publisherId);
          }
        }
        for (k = 0, len2 = publishers.length; k < len2; k++) {
          publisher = publishers[k];
          buildAvatar(publisher, threadsVm, onChange);
        }
        return typeof onChange === "function" ? onChange(threadsVm) : void 0;
      });
      resource.$promise["catch"](function() {});
      return resource.$promise["finally"](function() {});
    };
    buildAvatar = function(handle, threadsVm, onChange) {
      var user, userParams;
      if (!threadsVm.avatars[handle]) {
        userParams = {
          handle: handle
        };
        user = UserAPIService.get(userParams);
        user.$promise.then(function(response) {
          threadsVm.avatars[handle] = AVATAR_URL + (response != null ? response.photoLink : void 0);
          return typeof onChange === "function" ? onChange(threadsVm) : void 0;
        });
        user.$promise["catch"](function() {});
        return user.$promise["finally"](function() {});
      }
    };
    return {
      get: get
    };
  };

  srv.$inject = ['ThreadsAPIService', 'AVATAR_URL', 'UserAPIService'];

  angular.module('appirio-tech-messaging').factory('ThreadsService', srv);

}).call(this);

(function() {
  'use strict';
  var srv;

  srv = function($resource, API_URL_V2) {
    var params, url;
    url = API_URL_V2 + '/users/:handle';
    params = {
      handle: '@handle'
    };
    return $resource(url, params);
  };

  srv.$inject = ['$resource', 'API_URL_V2'];

  angular.module('appirio-tech-messaging').factory('UserAPIService', srv);

}).call(this);

(function() {
  'use strict';
  var filter;

  filter = function() {
    return function(createdAt) {
      return moment(createdAt).fromNow();
    };
  };

  angular.module('appirio-tech-messaging').filter('timeLapse', filter);

}).call(this);
