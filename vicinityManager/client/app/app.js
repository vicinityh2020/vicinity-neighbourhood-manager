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
config(function($stateProvider, $urlRouterProvider){
  $urlRouterProvider.otherwise('/home');
  
  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: 'modules/home/views/home.html',
      controller: 'driversController'
    })
    .state('login', {
      url: '/login',
      templateUrl: 'modules/authentication/views/login.html',
      controller: 'LoginController'
    });
  
})
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
.run(['$rootScope', '$location', '$cookies', '$http',
      function($rootScope, $location, $cookies, $http){
        
        $rootScope.globals = $cookies.get('globals') || {};
        if ($rootScope.globals.currentUser) {
          $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
        }
        
        $rootScope.$on('$locationChangeStart', function(evetn, next, current) {
          
          if($location.path() !== '/login' && !$rootScope.globals.currentUser){
            $location.path('/login');
          }
        });
      }]);