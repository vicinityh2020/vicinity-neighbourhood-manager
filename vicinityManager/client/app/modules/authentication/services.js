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
              $window.sessionStorage.username = (tok.name) || {};
              $window.sessionStorage.userAccountId = (tok.uid) || {};
              $window.sessionStorage.companyAccountId = (tok.cid) || {};
              $http.defaults.headers.common['x-access-token'] = $window.sessionStorage.token;
            }
          };

          service.ClearCredentials = function(){
            $window.sessionStorage.removeItem('token');
            $window.sessionStorage.removeItem('username');
            $http.defaults.headers.common['x-access-token'] = "";
          };


          service.ClearCredentialsAndInvalidateToken = function(){
            //TODO: Invalidate token
//            $http.post("http://localhost:3000/api/authenticate/invalidate",{token: $window.sessionStorage.token});
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
    /* jshint ignore:start */

    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        },

        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                window.alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    };

    /* jshint ignore:end */
})

// ======= INITIALIZE token interceptor =======

.factory('jwtTokenHttpInterceptor',
        ['Base64',
        function(Base64){
  console.log('Begin: Inicialized jwtTokenHttpInterceptor');

  var tokenInjector = {
    request: function(config) {
      var auth = Base64.encode('vicinity-nm:VredesteinLatexMliekoNaDefekt500ml');
      // config.headers['Authorization'] = 'Basic d2VudHdvcnRobWFuOkNoYW5nZV9tZQ==';
      config.headers.Authorization = 'Basic ' + auth;
      return config;
    }
  };

  console.log('End: Inicialized jwtTokenHttpInterceptor');
  return tokenInjector;

}])

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

}]);
