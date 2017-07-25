var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

var Schema = mongoose.Schema;

// Vicinity neighorhood schemas

var userAccount = new Schema({
  organisation: String,
  avatar: String,
  creatorOf: [ObjectId], //Creator of UserAccounts
  follows: [ObjectId], //Follows UserAccounts
  memberOf: [ObjectId], //Member of UserGroups
  location: String,
  businessId : String,
  accountOf: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }], //UserAccount is account of Agent
  knows: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userAccount'
  }],
  knowsRequestsFrom: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAccount'
  }],
  knowsRequestsTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAccount'
  }],
  hasNotifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'notification'
  }],
  hasNodes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'node'
  }],
  modifierOf: [ObjectId], //UserAccount is modifier of Item, Container or Space
  administratorOf: [ObjectId], //UserAccount is administrator of Item, Container or Space
  badges:[String],
  notes:String
});

var user = new Schema({
  avatar: String,
  name: String,
  firstName: String,
  surname: String,
  lastName: String,
  occupation: String,
  location: String,
  email: String,
  status: String,
  organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userAccount'
  },
  authentication: {
    password: String,
    principalRoles: [String]
  }
});

var invitation = {
    emailTo: String,
    nameTo: String,
    sentBy: {
        name: String,
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'userAccount'
        },
        organisation: String,
        email: String
    },
    type: {type: String, enum: ['newCompany','newUser']}
};

var registration = {
    userName: String,
    email: String,
    password: String,
    occupation: String,
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAccount'
    },
    companyName: String,
    companyLocation: String,
    termsAndConditions: Boolean,
    businessId: String,
    status: {type: String, enum: ['open','verified','declined','pending']},
    type: {type: String, enum: ['newCompany','newUser']}
};

var notification = {
    addressedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAccount'
    }],
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userAccount'
    },
    sentByReg: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registration'
    },
    type: {type: String,
      enum: ['friendRequest',
            'deviceRequest',
            'registrationRequest',
            'deviceEnabled',
            'deviceDisabled',
            'deviceDiscovered']
            },
    deviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'item'
    },
    status: {type: String, enum: ['waiting','responded','accepted','rejected']},
    isUnread: Boolean
};

var userGroup = {
  name: String,
  avatar: String,
  hasAdministrator: [ObjectId]
};

var organisationUnit = {
  name: String,
  consistsOf: [ObjectId] // OrganisationUnit consist of Gateways
};

var gateway = {
  name: {type: String, required: true},
  hasAdministrator: [{type: mongoose.Schema.Types.ObjectId, ref: 'userAccount'}],
  hasAccess: [{type: mongoose.Schema.Types.ObjectId, ref: 'userAccount'}],
  consistsOf: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'item'
  }] // Gateway has Items.
};

var item = new Schema({
  name: String,
  oid: String, // Object id -- different to Mongo uid
  aid: String, // Agent id
  hasAdministrator: [{type: mongoose.Schema.Types.ObjectId, ref: 'userAccount'}],
  hasAccess: [{type: mongoose.Schema.Types.ObjectId, ref: 'userAccount'}],
  accessRequestFrom: [{type: mongoose.Schema.Types.ObjectId, ref: 'userAccount'}],
  accessLevel: Number,
  avatar: String,
  info: mongoose.Schema.Types.Mixed, // Thing description, object with flexible schema
  typeOfItem: {type: String, enum: ['device','service']},
  status: String // Enabled or disabled
});

var remember = {
  token: {type: String, required: true},
};

var node = {
  name: {type: String, required: true},
  eventUri: String,
  organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userAccount'
  },
  type: [String],
  agent: String,
  status: String,
  hasItems: [String]
};

// Indexes to perform text search ======
// Only works for FULL TEXT search !!!!
// userAccount.index({organisation: 'text'});
//
// user.index({name: 'text'});
//
// item.index({name: 'text'});

// Indexes for common field searchUser

userAccount.index({organisation: 1});

user.index({name: 1});

item.index({name: 1, oid: 1});

// Exports =============================

module.exports.userAccount = mongoose.model('userAccount', userAccount);
module.exports.user = mongoose.model('user', user);
module.exports.userGroup = mongoose.model('userGroup', userGroup);
module.exports.organisationUnit = mongoose.model('organisationUnit', organisationUnit);
module.exports.gateway = mongoose.model('gateway', gateway);
module.exports.item = mongoose.model('item', item);
module.exports.notification = mongoose.model('notification', notification);
module.exports.invitation = mongoose.model('invitation', invitation);
module.exports.registration = mongoose.model('registration', registration);
module.exports.remember = mongoose.model('remember', remember);
module.exports.node = mongoose.model('node', node);
