var mongoose = require('mongoose');

var mongoSchema = mongoose.Schema();
var ObjectId = mongoose.Schema.Types.ObjectId;

var userAccount = {
  email: String,
  avatar: String,
  authentication: {
    password: String,
    principalRoles: [String]},
  creatorOf: [ObjectId], //Creator of UserAccounts
  follows: [ObjectId], //Follows UserAccounts
  memberOf: [ObjectId], //Member of UserGroups
  accountOf: {
    name: String,
    firstName: String,
    surname: String,
    lastName: String}, //UserAccount is account of Agent
  knows: [ObjectId],
  modifierOf: [ObjectId], //UserAccount is modifier of Item, Container or Space
  administratorOf: [ObjectId] //UserAccount is administrator of Item, Container or Space
};

//var userGroup = new Schema({
//  name: String,
//  avatar: String,
//  hasAdministrator: [Schema.Types.ObjectId]
//});
//

//
//var organisationUnit = new Schema({
//  name: String,
//  consistsOf: [Schema.Types.ObjectId] // OrganisationUnit consist of Gateways
//});
//
//var gateway = new Schema({
//  name: String,
//  consistsOf: [Schema.Types.ObectId] // Gateway has Items.
//});
//
//var item = new Schema({
//  name: String,
//  consistsOf: {type: String, id: [Schema.Types.ObjectId]} // Item has items.
//});

module.exports.userAccount = mongoose.model('userAccount', userAccount);

