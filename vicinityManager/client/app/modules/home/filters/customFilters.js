'use strict';
angular.module('VicinityManagerApp.filters')
/*
Filters out based on visibility level:
Public, private, friends
*/
.filter('visibilityFilter',
 function() {
  return function(input, filterTerm) {

    var out = [];

    angular.forEach(input,
      function(device) {
        var key = new RegExp(device.accessLevel, "i");
        if(filterTerm !== "0"){
          if (key.test(filterTerm)) {
            out.push(device);
          }
        } else {
          out.push(device);
        }
      }
    );
    return out;
  };
})
/*
Filter based on input using regexp substring comparison
*/
.filter('nameFilter',
 function() {
  return function(input, searchTerm) {

    var out = [];
    var keyword = new RegExp(searchTerm, "i");

    angular.forEach(input,
      function(item) {
       if (keyword.test(item.name)) {
          out.push(item);
       }
      }
    );
    return out;
  };
});
