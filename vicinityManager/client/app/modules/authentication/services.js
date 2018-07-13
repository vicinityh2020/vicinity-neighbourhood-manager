'use strict'

angular.module('Authentication')

.factory('AuthenticationService',
        ['Base64', '$http', '$cookies', '$rootScope', '$timeout', '$window', '$location', 'configuration', 'tokenDecoder', 'Notification',
        function(Base64, $http, $cookies, $rootScope, $timeout, $window, $location, configuration, tokenDecoder, Notification){

          var service = {};

          service.recover = function(data) {
            return $http.post(configuration.apiUrl + '/login/recovery',data);
          };

          service.resetPwd = function(id, data) {
            return $http.put(configuration.apiUrl + '/login/recovery/' + id ,data);
          };

          service.Login = function(username, password) {
            return $http.post(configuration.apiUrl + '/login/authenticate',{ username: username, password: password});
          };

          service.signout = function(path){
            // console.log(path);
            service.ClearCredentialsAndInvalidateToken();
            $location.path(path);
            // $cookies.remove("rM_V"); Implemented in userAccountController
          };

          service.SetCredentials = function(authResponse){
            if (authResponse) {
              $window.sessionStorage.token = (authResponse.token) || {};
              var tok = tokenDecoder.deToken();
              $window.sessionStorage.username = (tok.sub) || {};
              $window.sessionStorage.userAccountId = (tok.uid) || {};
              $window.sessionStorage.companyAccountId = (tok.orgid) || {};
              $window.sessionStorage.cid = (tok.cid) || {};
              $http.defaults.headers.common['x-access-token'] = $window.sessionStorage.token;
            }
          };

          service.ClearCredentials = function(){
            $window.sessionStorage.removeItem('token');
            $window.sessionStorage.removeItem('username');
            $window.sessionStorage.removeItem('userAccountId');
            $window.sessionStorage.removeItem('companyAccountId');
            $window.sessionStorage.removeItem('cid');
            $http.defaults.headers.common['x-access-token'] = "";
          };


          service.ClearCredentialsAndInvalidateToken = function(){
            //TODO: Invalidate token
            // $http.post("http://localhost:3000/api/authenticate/invalidate",{token: $window.sessionStorage.token});
            service.ClearCredentials();
          };

          // If there is a cookie, look if it has assigned an id and if so refresh token and log the user
          // If the token in the cookie is faked or expired, the refresh token process will fail
          service.wasCookie = function(){
            var myCookie = $cookies.getObject("rM_V");
            if(myCookie){
              $http.put(configuration.apiUrl + '/login/remember/' + myCookie.id, {token : myCookie.token})
                .then(
                    function successCallback(response){
                      if(!response.data.error){
                        service.SetCredentials(response.data.message);
                        $location.path("/home");
                      }else{
                        Notification.error('Token expired');
                      }
                    },
                    function errorCallback(response){
                      Notification.error('Error processing token');
                    }
                );
              }
              return false;
            };

          service.SetRememberMeCookie = function(data){
            $http.post(configuration.apiUrl + '/login/remember', data).then(
              function successCallback(response){
                var content = {id: response.data.message._id, token:response.data.message.token};
                $cookies.remove("rM_V");
                $cookies.putObject("rM_V",content);
              }
            );
          };

          return service;
}])

//  Enconding/Decoding + JWT   =======================================

.factory('Base64', function () {
    return {
        encode: function (str) {
          // Base64 encoder
          // first we use encodeURIComponent to get percent-encoded UTF-8,
          // then we convert the percent encodings into raw bytes which
          // can be fed into btoa.
          return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
              function toSolidBytes(match, p1) {
                  return String.fromCharCode('0x' + p1);
          }));

        },

        decode: function (str) {
          // Base64 decoder
          // Going backwards: from bytestream, to percent-encoding, to original string.
          return decodeURIComponent(atob(str).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
        }
    };
})

// ======= Decode token as a service =======

.factory('tokenDecoder',
        ['Base64', '$window',
        function(Base64, $window){
          var dT = {};
          dT.deToken = function(){
            var token = $window.sessionStorage.token;
            //var header = token.split('.')[0];
            var payload = token.split('.')[1];
            //var decodedHeader = Base64.decode(header);
            var decodedPayload = Base64.decode(payload);
            var decodedPayload2 = decodedPayload.split('}')[0] + '}';
            // var headerObj = JSON.parse(decodedHeader);
            var payloadObj = JSON.parse(decodedPayload2, function(key, value){
              //console.log(key);
              return value;
            });
          return payloadObj;
      };
      return dT;
    }]
  );
