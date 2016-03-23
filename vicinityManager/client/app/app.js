'use strict';

angular.module('Authentication', ['ngCookies']);

// Declare app level module which depends on views, and components
var feederApp = angular.module('VicinityManagerApp', [
//  'ngRoute',
  'ui.router',
  'VicinityManagerApp.controllers',
  'VicinityManagerApp.services',
  'VicinityManagerApp.version',
  'ngCookies',
  'Authentication'
]).
  config(function($stateProvider, $urlRouterProvider) {
  //$urlRouterProvider.otherwise('/home');
  
//  $stateProvider
//    .state('main', {
//      abstract: true,
//      templateUrl: 'modules/home/views/home.html',
//    })
//    .state('main.home', {
//      url: '/home',
//      views: {
//        'messagesMenuView':
//          {
//            templateUrl: 'modules/home/views/home.messagesMenuView.html'
//          },
//        'notificationsMenuView':
//          {
//            templateUrl: 'modules/home/views/home.notificationsMenuView.html'
//          },
//        'taskMenuView':
//          {
//            templateUrl: 'modules/home/views/home.taskMenuView.html'
//          },
////        'mainContentView':
////          {
////            templateUrl: 'modules/home/views/home.userProfileView.html'
////          },
//        'userAccountView':
//          {
//            templateUrl: 'modules/home/views/home.userAccountView.html',
//            controller: 'userAccountController'
//          }
//      }
//    })
//    .state('main.home.profile', {
//      url: '/profile',
//      views: {
//        'mainContentView@main':
//        {
//          //templateUrl: 'modules/home/views/home.userProfileView.html'
//          template: '<h1>main.home.profiles</h1>'
//        }
//      }
//    })
  
  $stateProvider
    .state('root', {
      abstract: true,
      templateUrl: 'modules/home/views/home.html',
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
          }
      }
    })
    .state('root.main.home', {
      url: '/home',
      views: {
        'mainContentView@root':
        {
          //templateUrl: 'modules/home/views/home.userProfileView.html'
          template: '<h1>root.main.home</h1>'
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
    .state('root.main.profile', {
      url: '/profile/:userAccountId',
      views: {
        'mainContentView@root':
        {
          templateUrl: 'modules/home/views/home.userProfileView.html',
          controller:  'userProfileController'
        }
      }
    })
//    .state('home', {
//      url: '/home',
//      templateUrl: 'modules/home/views/home.html',
//      controller: 'driversController',
//      onEnter: function(){
//        console.log('Activating state home');
//      }
//    })
//    .state('home.headerNavBar', {
//      url: '/home',
//      templateUrl: 'modules/home/views/home.headerNavBar.html',
//      controller: 'headerNavBarController',
//      onEnter: function(){
//        console.log('home.headerNavBar');
//      }
//    })
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
//config(['$routeProvider', function($routeProvider) {
//  $routeProvider.
//    when("/", {templateUrl: "partials/drivers.html", controller: "driversController"}).
//    when("/login", {templateUrl: "modules/authentication/views/login.html", controller: "LoginController"}).
//    when("/drivers", {templateUrl: "partials/drivers.html", controller: "driversController"}).
//    when("/drivers/:id", {templateUrl: "partials/driver.html", controller: "driverController"}).
//    when("/sensors_electro", {templateUrl: "partials/sensors_electro.html", controller: "sensorsElectroController"}).
//    when("/sensors_heating", {templateUrl: "partials/sensors_heating.html", controller: "sensorsHeatingController"}).
//    when("/sensors_temperature", {templateUrl: "partials/sensors_temperature.html", controller: "sensorTemperatureController"}).
//    when("/parking_slots", {templateUrl: "partials/parking_slots.html", controller: "parkingSlotsController"}).
//    otherwise({redirectTo: '/login'});
//}]);
.run(['$rootScope', '$location', '$cookies', '$http', '$window',
      function($rootScope, $location, $cookies, $http, $window){
        
      
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