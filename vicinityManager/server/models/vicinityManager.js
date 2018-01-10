// Global variables and definitions =========

var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

var Schema = mongoose.Schema;

// Vicinity neighorhood schemas ============

// TODO Remove unnecesary joins between schemas (ref:)

var userAccount = new Schema({
  name: {type: String, required: true},
  cid: {type: String, required: true},
  businessId : {type: String, required: true},
  accountOf:[{
    id: { type: ObjectId, ref: 'user' },
    extid: String
  }],
  knows:[{
    id: {type: ObjectId, ref: 'userAccount'},
    extid: String
  }],
  knowsRequestsFrom:[{
    id: {type: ObjectId, ref: 'userAccount'},
    extid: String
  }],
  knowsRequestsTo:[{
    id: {type: ObjectId, ref: 'userAccount'},
    extid: String
  }],
  hasNodes:[{
    id: { type: ObjectId, ref: 'node' },
    extid: String
  }],
  hasNotifications: [{ type: ObjectId, ref: 'notification' }],
  skinColor: {type: String, enum: ['blue', 'red', 'green', 'purple', 'yellow', 'black']},
  avatar: String,
  location: String,
  notes: String,
  status: String
});

var user = new Schema({
  name: {type: String, required: true},
  email: {type: String, required: true},
  cid: {
    id: { type: ObjectId, ref: 'userAccount', required: true},
    extid: String
  },
  occupation: String,
  location: String,
  avatar: String,
  status: String,
  accessLevel: {type: Number, enum: [0, 1, 2]},
  /* 0 - Only organisation
  1 - Friends
  2 - Everyone */
  authentication: {
    password: {type: String, required: true},
    principalRoles: [{type: String, required: true}]
  },
  hasItems: [{
    id: { type: ObjectId, ref: 'item' },
    extid: String
  }], // Own items and foreign items under contract
  hasContracts: [{
    id: {type: ObjectId, ref: 'contract', required: true},
    extid: String,
    contractingParty: {type: String, required: true}
  }]
});

var node = new Schema({
  adid: {type: String, required: true},
  name: {type: String, required: true},
  cid: {
    id: {type: ObjectId, ref: 'userAccount'},
    extid: String
  },
  type: [{type: String, required: true}],
  status: String,
  hasItems: [{
    id: { type: ObjectId, ref: 'item' },
    extid: String
  }],
  eventUri: String,
  agent: String
});

var item = new Schema({
  name: {type: String, required: true},
  avatar: String,
  oid: {type: String, required: true}, // Object id -- different to Mongo uid
  adid: {
    id: {type: ObjectId, ref: 'node'},
    extid: String
  }, // Agent id
  cid: {
    id: {type: ObjectId, ref: 'userAccount'},
    extid: String
  },
  uid: {
    id: {type: ObjectId, ref: 'user'},
    extid: String
  },
  hasContracts: [{
    id: {type: ObjectId, ref: 'contract', required: true},
    extid: String,
    contractingParty: {type: String, required: true}
  }],
  accessLevel: {type: Number, default: 1},
  typeOfItem: {type: String, enum: ['device','service']},
  status: {type: String, default: 'disabled'}, // Enabled, disabled or deleted
  info: mongoose.Schema.Types.Mixed // Thing description, object with flexible schema
});

var contract = new Schema({
ctid: {type: String, required: true},
cid: {
  id: {type: ObjectId, ref: 'userAccount'},
  extid: String
},
serviceProvider:{
  uid: {
    id: {type: ObjectId, ref: 'user'},
    extid: String
  },
  termsAndConditions: Boolean,
  items: [{
    id: { type: ObjectId, ref: 'item' },
    extid: String
  }]
},
iotOwner:{
  uid: {
    id: {type: ObjectId, ref: 'user'},
    extid: String
  },
  termsAndConditions: Boolean,
  items: [{
    id: { type: ObjectId, ref: 'item' },
    extid: String
  }]
},
accessRights: { type: String, enum:['R', 'W'] },
legalDescription: String,
type: { type: String, enum: ['serviceRequest', 'deviceUse']},
status: { type: String, enum: ['pending', 'accepted', 'cancelled', 'rejected']}
});

var invitation = new Schema({
    emailTo: String,
    nameTo: String,
    sentBy: {
        name: String,
        companyId: { type: ObjectId, ref: 'userAccount'},
        organisation: String,
        email: String
    },
    type: {type: String, enum: ['newCompany','newUser']}
});

var registration = new Schema({
    userName: String,
    email: String,
    password: String,
    occupation: String,
    companyId: { type: ObjectId, ref: 'userAccount'},
    companyName: String,
    companyLocation: String,
    termsAndConditions: Boolean,
    businessId: String,
    status: {type: String, enum: ['open','verified','declined','pending']},
    type: {type: String, enum: ['newCompany','newUser']}
});

var notification = new Schema({
    addressedTo: [{ type: ObjectId, ref: 'userAccount' }],
    sentBy: { type: ObjectId, ref: 'userAccount' },
    sentByReg: { type: ObjectId, ref: 'registration' },
    itemId: { type: ObjectId, ref: 'item' },
    userId: { type: ObjectId, ref: 'user' },
    isUnread: { type: Boolean, default: true },
    status: {type: String, enum: ['waiting', 'info', 'accepted', 'rejected', 'responded'], required: true},
    type: {type: Number, enum: [1, 11, 12, 13, 21, 22, 23, 24, 31, 32, 33, 34, 35, 36], required: true}
    /*
    1 - registrationRequest - toAnswer
    11 - itemEnabled - info
    12 - itemDisabled - info
    13 - itemDiscovered - info
    21 - itemconnRequest - toAnswer
    22 - itemconnRejected - info
    23 - itemconnCancelled - info
    24 - itemconnAccepted - info
    31 - partnershipRequest  - toAnswer
    32 - partnershipCancelled - info
    33 - partnershipRejected - info
    34 - partnershipAccepted - info
    35 - partnershipRequested - info
    36 - partnershipRequestCancelled - info
    ...
    */
});

var remember = new Schema({
  token: {type: String, required: true},
});

var auditLog = new Schema({
  auditId: {type: String, required: true}, // Can be oid or cid (extid)
  data: [ {
    creationDate: { type: Date, default: Date.now },
    triggeredByMe: { type: Boolean, default: true }, // Was the audit triggered by an event in your organisation??
    user: { type: String, default: "Unknown" }, // User generating the event
    orgOrigin: { // Organisation generating the event
      id: {type: ObjectId, ref: 'userAccount'},
      extid: String
    },
    orgDest: { // Organisation receiving the event
      id: {type: ObjectId, ref: 'userAccount'},
      extid: String
    },
    auxConnection: { // Depending on the audit, we need another connection to user, org, item or node
    kind: String,
    item: { type: ObjectId, refPath: 'data.auxConnection.kind' },
    extid: String
    },
    description: { type: String }, // Additional info like: Privacy lvl, new user role, ...
    eventType: { type: Number, enum: [1, 2, 11, 12, 13, 21, 22, 23, 31, 32, 33, 34, 35, 41, 42, 43, 44, 45, 51, 52, 53, 54, 55], required: true } // Actual situation which triggered the audit
    /*
    Organisation:
    1 - Created ->
    2 - Deleted ->
    11 - New user ->
    12 - User deleted ->
    13 - User modified ->
    21 - New node ->
    22 - Node deleted ->
    23 - Node modified ->
    31 - Request partnership <->
    32 - Cancel request <->
    33 - Accept partnership <->
    34 - Reject partnership <->
    35 - Cancel partnership <->
    Item:
    41 - Item discovered ->
    42 - Item deleted ->
    43 - Item enabled ->
    44 - Item disabled ->
    45 - Privacy change ->
    51 - Accept connection <->
    52 - Reject connection <->
    53 - Cancel connection <->
    54 - Request connection <->
    55 - ConnReq cancelled <->
    ...
    */
  } ]
});

// Set schema options ==================================

// TODO Set all autoIndex to false when moving to production
// autoIndex option ensures that the index is created, BUT is heavily time consuming
userAccount.set('autoIndex',true);
user.set('autoIndex',true);
item.set('autoIndex',true);
notification.set('autoIndex',true);
invitation.set('autoIndex',true);
registration.set('autoIndex',true);
remember.set('autoIndex',true);
node.set('autoIndex',true);
auditLog.set('autoIndex',true);
contract.set('autoIndex',true);

// Converts the mongoose document into a plain javascript object
// userAccount.set('toJSON',{ getters: true, virtuals: false });
// user.set('toJSON',{ getters: true, virtuals: false });
// item.set('toJSON',{ getters: true, virtuals: false });
// notification.set('toJSON',{ getters: true, virtuals: false });
// invitation.set('toJSON',{ getters: true, virtuals: false });
// registration.set('toJSON',{ getters: true, virtuals: false });
// remember.set('toJSON',{ getters: true, virtuals: false });
// node.set('toJSON',{ getters: true, virtuals: false });
// auditLog.set('toJSON',{ getters: true, virtuals: false });
// contract.set('toJSON',{ getters: true, virtuals: false });

// Ensures that values passed to our model constructor that
// were not specified in our schema do not get saved to the db
// Set to true by default
// userAccount.set('strict',true);
// ...

// Indexes to perform text search =======================

/* Only works for FULL TEXT search !!!!
userAccount.index({name: 'text'});
user.index({name: 'text'});
item.index({name: 'text'}); */

// Indexes for common field searchUser  =================
// TODO set the index as unique once server side and agent are prepared
userAccount.index({name: 1}, { unique: false });
userAccount.index({cid: 1}, { unique: false });
user.index({name: 1}, { unique: false });
// item.index({name: 1, oid: 1}); // Compound indexes cannot be created in the schema definition!
item.index({oid: 1}, { unique: false });
item.index({name: 1}, { unique: false });
node.index({adid: 1}, { unique: false });
auditLog.index({auditId: 1}, { unique: true});
contract.index({ctid: 1}, { unique: true});


// Exports models  ===============================

module.exports.userAccount = mongoose.model('userAccount', userAccount);
module.exports.user = mongoose.model('user', user);
module.exports.item = mongoose.model('item', item);
module.exports.notification = mongoose.model('notification', notification);
module.exports.invitation = mongoose.model('invitation', invitation);
module.exports.registration = mongoose.model('registration', registration);
module.exports.remember = mongoose.model('remember', remember);
module.exports.node = mongoose.model('node', node);
module.exports.auditLog = mongoose.model('auditLog', auditLog);
module.exports.contract = mongoose.model('contract', contract);
