var mongoose = require("mongoose");

mongoose.connect('mongodb://vicinity_user:Ysq.rvE!(wg#Vp4_@ds060478.mongolab.com:60478/vicinity_neighbourhood_manager', function(error){
  if (error){
    console.log("Couldn't connect to data source!");
  } else {
    console.log("Datasource connection establised!");
  }
});

var mongoSchema = mongoose.Schema;

var userSchema = {
  "username": String,
  "password": String
};

module.exports = mongoose.model('userLogin', userSchema);