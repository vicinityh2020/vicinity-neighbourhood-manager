var mongoose = require('mongoose');

var Schema = mongoose.Schema();

var userAccount = new Schema({
  email: String,
  emailSHA1: String,
  avatar: String,
  creatorOf: [Schema.types.ObjectId], //Creator of UserAccounts
  follows: [Schema.types.ObjectId], //Follows UserAccounts
  memberOf: [Schema.Types.ObjectId], //Member of UserGroups
  accountOf: [Schema.Types.ObjectId], //UserAccount is account of Agent
  modifierOf: [Schema.Types.ObjectId], //UserAccount is modifier of Item, Container or Space
  administratorOf: [Schema.Types.ObjectId], //UserAccount is administrator of Item, Container or Space
});

var userGroup = new Schema({
  name: String,
  avatar: String,
  hasAdministrator: [Schema.Types.ObjectId]
});

var agent = new Schema({
  name: String,
  firstName: String,
  surname: String,
  lastName: String,
  knows: [Schema.types.ObjectId] // Agent knows agent
});

