'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('homeController',
            ['$scope', '$window', 'Base64','tokenDecoder',

            function ($scope, $window, Base64, tokenDecoder) {
              $(window).trigger('resize');

              $scope.isDev = false;
              $scope.isInfOp = false;

              var myInit = function(){
                var payload = tokenDecoder.deToken();

                for(var i in payload.roles){
                  if(payload.roles[i] === 'devOps'){
                    $scope.isDev = true;
                  }
                  if(payload.roles[i] === 'infrastructure operator'){

                    $scope.isInfOp = true;
                  }
                }
              };

              myInit();

    // Scroll to top
    
    $scope.goToTop = function(){
        $window.scrollTo(0, 0);
    };

}]);
