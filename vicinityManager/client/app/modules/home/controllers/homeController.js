angular.module('VicinityManagerApp.controllers')
.controller('homeController',
            ['$scope', '$window', 'Base64','tokenDecoder',

            function ($scope, $window, Base64, tokenDecoder) {

              $scope.isDev = false;

              var myInit = function(){
                var payload = tokenDecoder.deToken();

                for(i in payload.roles){
                  if(payload.roles[i] === 'devOps'){
                    $scope.isDev = true;
                  };
                };
              }

              myInit();

}]);
