'use strict';

angular.module('Authentication', ['ngCookies']);

// Declare app level module which depends on views, and components
angular.module('VicinityManagerApp', [
//  'ngRoute',
  'ui.router',
  'VicinityManagerApp.controllers',
  'VicinityManagerApp.services',
  'VicinityManagerApp.version',
  'ngCookies',
  'ui-notification',
  'Authentication'
]).
  config(function($stateProvider, $urlRouterProvider) {


    $stateProvider
        .state('root', {
          abstract: true,
          templateUrl: 'modules/home/views/home.html'
        })
        .state('root.main', {
          url: '',
          abstract:true,
          views: {
            'messagesMenuView':
              {
                templateUrl: 'modules/home/views/home.messagesMenuView.html'
              },
            'notificationsMenuView':
              {
                templateUrl: 'modules/home/views/home.notificationsMenuView.html'
              },
            'taskMenuView':
              {
                templateUrl: 'modules/home/views/home.taskMenuView.html'
              },
            'userAccountView':
              {
                templateUrl: 'modules/home/views/home.userAccountView.html',
                controller: 'userAccountController'
              },
            'companyAccountView':
              {
                templateUrl: 'modules/home/views/home.companyAccountView.html',
                controller: 'companyAccountController'
              }
          }
        })
        .state('root.main.home', {
          url: '/home',
          views: {
            'mainContentView@root':
              {
                templateUrl: 'modules/home/views/home.neighbourhoodView.html',
                controller: 'neighbourhoodController'
              }
          }
        })
        .state('root.main.neigbourhood', {
          url: '/neighbourhood',
          views: {
            'mainContentView@root':
              {
                templateUrl: 'modules/home/views/home.neighbourhoodView.html',
                controller: 'neighbourhoodController'
              }
          }
        })
        .state('root.main.mydevices', {
          url: '/mydevices',
          views: {
            'mainContentView@root':
              {
                templateUrl: 'modules/home/views/home.mydevicesView.html',
                controller: 'myDevicesController'
              }
          }
        })
        .state('root.main.searchresults', {
          url: '/search/:searchTerm',
          views: {
            'mainContentView@root':
                {
                  templateUrl: 'modules/home/views/home.searchView.html',
                  controller: 'searchController'
                }
          }
        })
        .state('root.main.companyProfile', {
          url: '/profile/company/:companyAccountId',
          views: {
            'mainContentView@root':
            {
              templateUrl: 'modules/home/views/home.companyProfileView.html',
              controller:  'companyProfileController'
            }
          }
        })


        .state('root.main.companyProfile.neigbourhood', {
            url: '/neighbourhood',
            views: {
                'tabPanel@root.main.profile':
                    {
                        templateUrl: 'modules/home/views/home.userProfile.neighbourhoodView.html'
                    }
            }
        })
        .state('root.main.companyProfile.friends', {
            url: '/friends',
            views: {
                'tabPanel@root.main.profile':
                    {
                        templateUrl: 'modules/home/views/home.userProfile.friendsView.html'
                    }
            }
        })

        .state('root.main.userProfile', {
          url: '/profile/user/:userAccountId',
          views: {
            'mainContentView@root':
            {
              templateUrl: 'modules/home/views/home.userProfileView.html',
              controller:  'userProfileController'
            }
          }
        })

        .state('login', {
          url: '/login',
          templateUrl: 'modules/authentication/views/login.html',
          controller: 'LoginController',
          onEnter: function(){
            console.log('Activating state home');
          }
        });

})
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('jwtTokenHttpInterceptor');
}])
//Angular UI Notification configuration;
    .config(function (NotificationProvider) {
        NotificationProvider.setOptions({
            delay: 10000,
            startTop: 20,
            startRight: 10,
            verticalSpacing: 20,
            horizontalSpacing: 20,
            positionX: 'left',
            positionY: 'bottom'
        });
    })
.run(['$rootScope', '$location', '$cookies', '$http', '$window',
      function($rootScope, $location, $cookies, $http, $window){

          FastClick.attach(document.body);
//        $rootScope.globals = $cookies.get('globals') || {};
//        if ($rootScope.globals.currentUser) {
//          $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
//        }

        if ($window.sessionStorage.token) {
          $http.defaults.headers.common['x-access-token'] = $window.sessionStorage.token;
        }

        $rootScope.$on('$locationChangeStart', function(evetn, next, current) {

        if($location.path() !== '/login' && !$window.sessionStorage.token){
//TODO: Check validy of the token, if token is invalid. Clear credentials and pass to the login page.
            $location.path('/login');
          }
        });


      }]);
