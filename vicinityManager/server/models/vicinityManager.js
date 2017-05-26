var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

var userAccount = {
  organisation: String,
  avatar: String,
  creatorOf: [ObjectId], //Creator of UserAccounts
  follows: [ObjectId], //Follows UserAccounts
  memberOf: [ObjectId], //Member of UserGroups
  location: String,
  businessID : String,
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
  modifierOf: [ObjectId], //UserAccount is modifier of Item, Container or Space
  administratorOf: [ObjectId], //UserAccount is administrator of Item, Container or Space
  badges:[String],
  notes:String
};

var user = {
  avatar: String,
  name: String,
  firstName: String,
  surname: String,
  lastName: String,
  occupation: String,
  location: String,
  email: String,
  // organisation: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'userAccount'
  // },
  authentication: {
    password: String,
    principalRoles: [String]
  }};

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
    // sentBy: String,
    type: {type: String, enum: ['newCompany','newUser']}
};

var registration = {
    // invitationId: String,
    // invitation: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'invitation'
    // },
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
    // nameTo: String,
    // sentBy: {
    //     name: String,
    //     organisation: String,
    //     email: String
    // },
    // // sentBy: String,
    // type: {type: String, enum: ['newCompany','newUser']}
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
    type: {type: String, enum: ['friendRequest','deviceRequest','registrationRequest']},
    deviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'item'
    },
    status: {type: String, enum: ['waiting','responded','accepted']},
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

var item = {
  name: String,
  consistsOf: {type: String, id: [ObjectId], required: false}, // Item has items.
  hasAdministrator: [{type: mongoose.Schema.Types.ObjectId, ref: 'userAccount'}],
  hasAccess: [{type: mongoose.Schema.Types.ObjectId, ref: 'userAccount'}],
  accessRequestFrom: [{type: mongoose.Schema.Types.ObjectId, ref: 'userAccount'}],
  accessLevel: Number,
  color: String,
  avatar: String,
  info: {
    serial_number: String,
    location: String,
    id_tag: String,
    id_value: String,
    status: String,
    datasources: [{
      name: String,
      typeOf: String,
      format: String,
      unitOfMeasurement: String
    }]
  },
  type: String
};

// var devOpsVicinity = {
//  userId : {
//        type: mongoose.Schema.Types.ObjectId,
//        ref: 'user'
//  },
//  companyId : {
//        type: mongoose.Schema.Types.ObjectId,
//        ref: 'userAccount'
//  },
// };

module.exports.userAccount = mongoose.model('userAccount', userAccount);
module.exports.user = mongoose.model('user', user);
module.exports.userGroup = mongoose.model('userGroup', userGroup);
module.exports.organisationUnit = mongoose.model('organisationUnit', organisationUnit);
module.exports.gateway = mongoose.model('gateway', gateway);
module.exports.item = mongoose.model('item', item);
module.exports.notification = mongoose.model('notification', notification);
module.exports.invitation = mongoose.model('invitation', invitation);
module.exports.registration = mongoose.model('registration', registration);
// module.exports.devOpsVicinity = mongoose.model('devOpsVicinity', devOpsVicinity);
