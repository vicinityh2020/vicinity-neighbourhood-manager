'use strict';

angular.module('constants',[]).constant('configuration', this._env);

angular.module('Authentication', ['ngCookies', 'constants', 'ui-notification','VicinityManagerApp.controllers']);
angular.module('Registration', ['ngCookies', 'constants', 'VicinityManagerApp.controllers']);

// Declare app level module which depends on views, and components
angular.module('VicinityManagerApp', [
//  'ngRoute',
  'ui.router',
  'VicinityManagerApp.controllers',
  'VicinityManagerApp.services',
  'VicinityManagerApp.filters',
  'VicinityManagerApp.version',
  'ngCookies',
  'ui-notification',
  'Authentication',
  'Registration',
  'constants',
  'angularFileUpload'
])
.config(function($stateProvider, $urlRouterProvider) {

// ====== HOME VIEW =======

    $stateProvider
        .state('root', {
          abstract: true,
          templateUrl: 'modules/home/views/home.html',
          controller: 'homeController',
        })
        .state('root.main', {
          url: '',
          abstract:true,
          views: {
            'notificationsMenuView':
              {
                templateUrl: 'modules/home/views/home.notificationsMenuView.html',
                controller: 'notifications'
              },
              'searchUp':
                {
                  templateUrl: 'modules/home/views/home.searchUpView.html',
                  controller: 'searchUpController'
                },
              'settingsMenuView':
                {
                  templateUrl: 'modules/home/views/home.settingsMenuView.html',
                  controller: 'settingsController'
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
                  templateUrl: 'modules/home/views/home.allDevicesView.html',
                  controller: 'allDevicesController'
                }
            }
          })

// ======== Side menu list views

        .state('root.main.allDevices', {
          url: '/allDevices/:searchTerm',
          views: {
            'mainContentView@root':
              {
                templateUrl: 'modules/home/views/home.allDevicesView.html',
                controller: 'allDevicesController'
              }
          }
        })

        .state('root.main.allEntities', {
          url: '/allEntities',
          views: {
            'mainContentView@root':
              {
                templateUrl: 'modules/home/views/home.allEntities.html',
                controller: 'allEntities'
              }
          }
        })

        .state('root.main.allServices', {
          url: '/allServices',
          views: {
            'mainContentView@root':
              {
                templateUrl: 'modules/home/views/home.allServices.html',
                controller: 'allServicesController'
              }
          }
        })

        .state('root.main.allRegistrations', {
          url: '/allRegistrations',
          views: {
            'mainContentView@root':
              {
                templateUrl: 'modules/home/views/home.registrationMasterDetail.html',
                controller: 'allRegistrationsController'
              }
          }
        })

        .state('root.main.myNodes', {
          url: '/myNodes',
          views: {
            'mainContentView@root':
              {
                templateUrl: 'modules/home/views/home.myNodesView.html',
                controller: 'myNodesController'
              }
          }
        })

        .state('root.main.contracts', {
          url: '/contracts',
          views: {
            'mainContentView@root':
              {
                templateUrl: 'modules/home/views/home.contracts.html',
                controller: 'contractsController'
              }
          }
        })

        .state('root.main.myNotifications', {
          url: '/myNotifications',
          views: {
            'mainContentView@root':
              {
                templateUrl: 'modules/home/views/home.myNotificationsView.html',
                controller: 'myNotificationsController'
              }
          }
        })

// =========  Sub views of items in side menu / PROFILES =========

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


        .state('root.main.companyProfile.devices', {
            url: '/devices',
            views: {
                'tabPanel@root.main.companyProfile':
                    {
                        templateUrl: 'modules/home/views/home.companyProfile.devicesView.html',
                        controller: 'cPdevicesController'
                    }
            }
        })

        .state('root.main.companyProfile.services', {
            url: '/services',
            views: {
                'tabPanel@root.main.companyProfile':
                    {
                        templateUrl: 'modules/home/views/home.companyProfile.servicesView.html',
                        controller: 'cPservicesController'
                    }
            }
        })

        .state('root.main.companyProfile.friends', {
            url: '/partners',
            views: {
                'tabPanel@root.main.companyProfile':
                    {
                        templateUrl: 'modules/home/views/home.companyProfile.friendsView.html',
                        controller: 'cPfriendsController'
                    }
            }
        })
        .state('root.main.companyProfile.history', {
            url: '/history',
            views: {
                'tabPanel@root.main.companyProfile':
                    {
                        templateUrl: 'modules/home/views/home.companyProfile.historyView.html',
                        controller: 'cPhistoryController'
                    }
            }
        })

        .state('root.main.companyProfile.userAccounts', {
            url: '/userAccounts',
            views: {
                'tabPanel@root.main.companyProfile':
                    {
                        templateUrl: 'modules/home/views/home.companyProfile.userAccountsView.html',
                        controller: 'cPuserAccountsController'
                    }
            }
        })

        .state('root.main.companyProfile.roleMgmt', {
            url: '/roleMgmt',
            views: {
                'tabPanel@root.main.companyProfile':
                    {
                        templateUrl: 'modules/home/views/home.companyProfile.roleMgmtView.html',
                        controller: 'cProleController'
                    }
            }
        })

        // TODO add services

        .state('root.main.serviceProfile', {
          url: '/profile/service/:serviceId',
          views: {
            'mainContentView@root':
            {
              templateUrl: 'modules/home/views/home.serviceProfileView.html',
              controller:  'serviceProfileController'
            }
          }
        })

        .state('root.main.serviceProfile.history', {
          url: '/history',
          views: {
            'tabPanel@root.main.serviceProfile':
            {
              templateUrl: 'modules/home/views/home.serviceProfile.historyView.html',
              controller:  'sPhistoryController'
            }
          }
        })

        .state('root.main.serviceProfile.whoSee', {
          url: '/whoSee',
          views: {
            'tabPanel@root.main.serviceProfile':
            {
              templateUrl: 'modules/home/views/home.serviceProfile.whoSeeView.html',
              controller:  'sPwhoSeeController'
            }
          }
        })

        .state('root.main.serviceProfile.description', {
          url: '/description',
          views: {
            'tabPanel@root.main.serviceProfile':
            {
              templateUrl: 'modules/home/views/home.serviceProfile.description.html',
              controller:  'sPdescriptionController'
            }
          }
        })

        .state('root.main.deviceProfile', {
          url: '/profile/device/:deviceId',
          views: {
            'mainContentView@root':
            {
              templateUrl: 'modules/home/views/home.deviceProfileView.html',
              controller:  'deviceProfileController'
            }
          }
        })

        .state('root.main.deviceProfile.history', {
          url: '/history',
          views: {
            'tabPanel@root.main.deviceProfile':
            {
              templateUrl: 'modules/home/views/home.deviceProfile.historyView.html',
              controller:  'dPhistoryController'
            }
          }
        })

        .state('root.main.deviceProfile.whoSee', {
          url: '/whoSee',
          views: {
            'tabPanel@root.main.deviceProfile':
            {
              templateUrl: 'modules/home/views/home.deviceProfile.whoSeeView.html',
              controller:  'dPwhoSeeController'
            }
          }
        })

        .state('root.main.deviceProfile.description', {
          url: '/description',
          views: {
            'tabPanel@root.main.deviceProfile':
            {
              templateUrl: 'modules/home/views/home.deviceProfile.description.html',
              controller:  'dPdescriptionController'
            }
          }
        })

        .state('root.main.userProfile', {
          url: '/profile/user/:companyAccountId/:userAccountId',
          views: {
            'mainContentView@root':
            {
              templateUrl: 'modules/home/views/home.userProfileView.html',
              controller:  'userProfileController'
            }
          }
        })

        .state('root.main.userProfile.devices', {
          url: '/devices',
          views: {
            'tabPanel@root.main.userProfile':
            {
              templateUrl: 'modules/home/views/home.userProfileView.devices.html',
              controller:  'uPdevicesController'
            }
          }
        })

        .state('root.main.userProfile.services', {
          url: '/services',
          views: {
            'tabPanel@root.main.userProfile':
            {
              templateUrl: 'modules/home/views/home.userProfileView.services.html',
              controller:  'uPservicesController'
            }
          }
        })

        .state('root.main.userProfile.history', {
          url: '/history',
          views: {
            'tabPanel@root.main.userProfile':
            {
              templateUrl: 'modules/home/views/home.userProfileView.history.html',
              controller:  'uPhistoryController'
            }
          }
        })

        // .state('root.main.userProfile.contracts', {
        //   url: '/contracts?contractId',
        //   // reloadOnSearch : false, // DEBUG case use query parameters to change view
        //   views: {
        //     'tabPanel@root.main.userProfile':
        //     {
        //       templateUrl: 'modules/home/views/home.userProfileView.contracts.html',
        //       controller:  'uPcontractsController'
        //     }
        //   }
        // })

        .state('root.main.registrationProfile', {
          url: '/profile/registration/:registrationId',
          views: {
            'mainContentView@root':
            {
              templateUrl: 'modules/home/views/home.registrationProfile.html',
              controller:  'registrationProfileController'
            }
          }
        })

        .state('root.main.registrationProfile.regAdmin', {
          url: '/regAdmin',
          views: {
            'tabPanel@root.main.registrationProfile':
            {
              templateUrl: 'modules/home/views/home.registrationProfile.regAdminView.html',
              controller:  'rPregAdminController'
            }
          }
        })

        .state('root.main.contractDetail', {
          url: '/contractDetail/:contractId',
          views: {
            'mainContentView@root':
            {
              templateUrl: 'modules/home/views/home.contractDetail.html',
              controller:  'contractDetailController'
            }
          }
        })

        .state('root.main.nodeDetail', {
          url: '/nodeDetail/:nodeId',
          views: {
            'mainContentView@root':
            {
              templateUrl: 'modules/home/views/home.nodeDetail.html',
              controller:  'nodeDetailController'
            }
          }
        })

        .state('root.main.requestService', {
          url: '/requestservice/:companyAccountId/:serviceId',
          views: {
            'mainContentView@root':
            {
              templateUrl: 'modules/home/views/home.contract.requestService.html',
              controller:  'cTrequestService'
            }
          }
        })
// ======= Login, Auth, invit, reg VIEWS ======

        .state('invitationOfNewUser', {
          url: '/invitation/newUser/:invitationId',
          templateUrl: 'modules/registration/views/invitation.newUser.html',
          controller: 'invitationNewUserController',
          // onEnter: function(){
          //  console.log('Activating state new user');
          // }
        })

        .state('invitationOfNewCompany', {
          url: '/invitation/newCompany/:invitationId',
          templateUrl: 'modules/registration/views/invitation.newCompany.html',
          controller: 'invitationNewCompanyController',
          // onEnter: function(){
          //  console.log('Activating state new company');
          // }
        })

        .state('registrationOfNewUser', {
          url: '/registration/newUser/:registrationId',
          templateUrl: 'modules/registration/views/registration.newUser.html',
          controller: 'registrationNewUserController',
          // onEnter: function(){
          //  console.log('Activating state new user reg');
          // }
        })

        .state('registrationOfNewCompany', {
          url: '/registration/newCompany/:registrationId',
          templateUrl: 'modules/registration/views/registration.newCompany.html',
          controller: 'registrationNewCompanyController',
          // onEnter: function(){
          //   console.log('Activating state new company reg');
          // }
        })

        .state('recoverPassword', {
          url: '/authentication/recoverPassword/:userId',
          templateUrl: 'modules/authentication/views/recoverPassword.html',
          controller: 'recoverPasswordController',
          // onEnter: function(){
          //   console.log('Activating state password recovery');
          // }
        })

        .state('login', {
          url: '/login',
          templateUrl: 'modules/authentication/views/login.html',
          controller: 'LoginController',
          // onEnter: function(){
          //   console.log('Activating state home');
          // }
        });

})

// Request pre-processing -- Sends JWT in every request

// .config(['$httpProvider', function($httpProvider) {
//   $httpProvider.interceptors.push('jwtTokenHttpInterceptor');
// }])

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

        $rootScope.$on('$stateChangeSuccess', function(){ // In case of state change do following actions...
          $rootScope.styles = ['hold-transition', 'skin-' + $rootScope.skinColor, 'sidebar-mini']; // checks if the skinColor changed
          $(window).trigger('resize'); // Prevents side bar bug
        });

        if ($window.sessionStorage.token) {
          $http.defaults.headers.common['x-access-token'] = $window.sessionStorage.token;
        }

        $rootScope.$on('$locationChangeStart', function(evetn, next, current) {

          if(($location.url() !== '/login') && !$window.sessionStorage.token){
              //TODO: Check validy of the token, if token is invalid. Clear credentials and pass to the login page.

            var p = $location.url();

            // Instead of replacing %2F for / check: https://stackoverflow.com/questions/41272314/angular-all-slashes-in-url-changed-to-2f
            var lastPos = p.lastIndexOf("/");

            // Case url has / encoded as %2F
            if(lastPos === 0){
              while(p.lastIndexOf("%2F") !== -1 ){
                p = p.replace("%2F","/");
              }
              lastPos = p.lastIndexOf("/");
            }

            // Divide url and id
            var strId = p.substring(p.length-24,p.length);
            var strBeg = p.substring(0,lastPos + 1);

            var patt1 = /[0-9a-fA-F]+/ ;
            var result1 = patt1.test(strId);

            if ((strBeg.indexOf('/invitation/newCompany/')) !== -1 && result1){
              $location.path('/invitation/newCompany/' + strId);
            }else if ((strBeg.indexOf('/invitation/newUser/')) !== -1 && result1){
              $location.path('/invitation/newUser/' + strId);
            }else if ((strBeg.indexOf('/registration/newCompany/')) !== -1 && result1){
              $location.path('/registration/newCompany/' + strId);
            }else if ((strBeg.indexOf('/registration/newUser/')) !== -1 && result1){
              $location.path('/registration/newUser/' + strId);
            }else if ((strBeg.indexOf('/authentication/recoverPassword/')) !== -1 && result1){
              $location.path('/authentication/recoverPassword/' + strId);
            }else{
              $location.path('/login');
            }
          }
        });

      }]);
