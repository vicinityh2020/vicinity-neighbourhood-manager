// Global variables and definitions =========

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

// Vicinity subSchemas - Replace repeated structures

var cidSchema = Schema({
  id: {type: ObjectId, ref: 'userAccount'},
  extid: String,
  name: String
},{ _id : false });

var adidSchema = Schema({
  id: {type: ObjectId, ref: 'node'},
  extid: String,
  name: String,
  type: {type: String, enum: ['vcnt', 'shq']}
},{ _id : false });

var uidSchema = Schema({
  id: {type: ObjectId, ref: 'user'},
  extid: String,
  name: String
},{ _id : false });

var oidSchema = Schema({
  id: {type: ObjectId, ref: 'item'},
  extid: String,
  name: String
},{ _id : false });

var contractItemSchema = Schema({
  id: {type: ObjectId, ref: 'item'},
  extid: String,
  name: String,
  inactive: {type: Boolean, default: true}
},{ _id : false });

var auditSchema = Schema({
  id: {type: ObjectId, ref: 'auditLog'},
  extid: String
},{ _id : false });

var interactionSchema = Schema({
  type: String,
  value: String
},{ _id : false });

var ctidSchema = Schema({
  id: {type: ObjectId, ref: 'contract'},
  extid: String,
  contractingUser: String,
  contractingParty: String,
  readWrite: {type: Boolean, default: false},
  approved: {type: Boolean, default: false},
  imAdmin: {type: Boolean, default: false},
  imForeign: {type: Boolean, default: false},
  inactive: [String]
},{ _id : false });

var contractSubschema = Schema({
  cid: cidSchema,
  uid: [ uidSchema ],
  termsAndConditions: {type: Boolean, default: false},
  items: [ contractItemSchema ]
},{ _id : false });

// Vicinity neighorhood schemas ============

var userAccount = new Schema({
  name: {type: String, required: true},
  cid: {type: String, required: true},
  businessId : {type: String, required: true},
  accountOf:[ uidSchema ],
  knows:[ cidSchema ],
  knowsRequestsFrom:[ cidSchema ],
  knowsRequestsTo:[ cidSchema ],
  hasNodes:[ adidSchema ],
  hasNotifications: [{ type: ObjectId, ref: 'notification' }],
  hasAudits: [ auditSchema ],
  skinColor: {type: String, enum: ['blue', 'red', 'green', 'purple', 'yellow', 'black']},
  avatar: String,
  location: String,
  notes: String,
  status: {type: String, enum: ['active', 'deleted'], default: 'active'},
  auto: { type: Boolean, default: false }
});

var user = new Schema({
  name: {type: String, required: true},
  email: {type: String, required: true},
  contactMail: {type: String, required: true},
  cid: cidSchema,
  occupation: String,
  location: String,
  avatar: String,
  status: {type: String, enum: ['active', 'deleted'], default: 'active'},
  accessLevel: {type: Number, enum: [0, 1, 2], default: 0},
  /* 0 - Only organisation
  1 - Friends
  2 - Everyone */
  authentication: {
    hash: { type: String, required: true},
    principalRoles: { type: [String], required: true }
  },
  /*
  user
  administrator - Can modify org profile
  infrastructure operator - Can request services
  service provider - Can have services
  device owner - Can have devices
  system integrator - Can set up infrastructures (gateways)
  devOps - Can control org registrations, webAdmin
  superUser - Can use automatic registration in API
  */
  hasNotifications: [{ type: ObjectId, ref: 'notification' }],
  hasAudits: [ auditSchema ],
  hasItems: [ oidSchema ], // Own items and foreign items under contract
  hasContracts: [ ctidSchema ]
});

var node = new Schema({
  adid: {type: String, required: true},
  name: {type: String, required: true},
  cid: cidSchema,
  type: [ String ],
  status: {type: String, enum: ['active', 'deleted']},
  hasItems: [ oidSchema ],
  eventUri: String,
  agent: String
});

var item = new Schema({
  name: {type: String, required: true},
  avatar: String,
  oid: {type: String, required: true}, // Object id -- different to Mongo uid
  adid: adidSchema, // Agent id
  cid: cidSchema,
  uid: uidSchema,
  interactionPatterns: [ interactionSchema ],
  hasContracts: [ ctidSchema ],
  hasAudits: [ auditSchema ],
  accessLevel: {type: Number, enum: [0, 1, 2], default: 0},
  typeOfItem: {type: String, enum: ['device','service']},
  status: {type: String, enum: ['disabled', 'enabled', 'deleted', 'pending'], default: 'disabled'}, // Enabled, disabled or deleted
  mode: {type: String, enum: ['production', 'testing'], default: 'production'},
  info: mongoose.Schema.Types.Mixed // Thing description, object with flexible schema
});

var contract = new Schema({
ctid: {type: String, required: true},
foreignIot: contractSubschema,
iotOwner: contractSubschema,
readWrite: Boolean, // True RW -- False R
legalDescription: String,
type: { type: String, enum: ['serviceRequest', 'deviceUse']},
status: { type: String, enum: ['active', 'deleted'], default: 'active'}
});

var invitation = new Schema({
    emailTo: String,
    nameTo: String,
    sentBy: {
        companyId: { type: ObjectId, ref: 'userAccount'},
        cid: String,
        organisation: String,
        email: String
    },
    used: {type: Boolean, default: false },
    type: {type: String, enum: ['newCompany','newUser']}
});

var registration = new Schema({
    userName: String,
    email: String,
    hash: String,
    salt: String,
    occupation: String,
    companyId: { type: ObjectId, ref: 'userAccount'},
    cid: String,
    companyName: String,
    companyLocation: String,
    termsAndConditions: Boolean,
    businessId: String,
    status: {type: String, enum: ['open','verified','declined','pending']},
    type: {type: String, enum: ['newCompany','newUser']}
});

var notification = new Schema({
    actor: {
      kind: String,
      item: { type: ObjectId, refPath: 'actor.kind' },
      extid: String
    },
    target: {
      kind: String,
      item: { type: ObjectId, refPath: 'target.kind' },
      extid: String
    },
    object: {
      kind: String,
      item: { type: ObjectId, refPath: 'object.kind' },
      extid: String
    },
    date: { type: Date, default: Date.now },
    message: String, // Enable personal messages possibility
    isUnread: { type: Boolean, default: true },
    status: {type: String, enum: ['waiting', 'info', 'accepted', 'rejected', 'responded'], required: true},
    type: {type: Number, enum: [1, 11, 12, 13, 21, 22, 23, 24, 25, 31, 32, 33, 34, 35, 36], required: true}
    /*
    1 - registrationRequest - toAnswer
    11 - itemEnabled - info
    12 - itemDisabled - info
    13 - itemDiscovered - info
    14 - itemUpdated - info
    21 - contractRequest - info
    22 - contractAccepted - info
    23 - contractCancelled - info
    24 - contractJoined - info
    25 - contractAbandoned - info
    26 - contractUpdated - info
    31 - partnershipRequest  - toAnswer
    32 - partnershipCancelled - info
    33 - partnershipRejected - info
    34 - partnershipAccepted - info
    35 - partnershipRequested - info
    36 - partnershipRequestCancelled - info
    41 - moveThingRequest - waiting
    42 - moveThingAccept - info
    43 - moveThingReject - info
    ...
    */
});

var auditLog = new Schema({
  audid: {type: String, required: true}, // extid
  date: { type: Date, default: Date.now },
  actor: {  // Always a user has to trigger an audit event
    kind: String,
    item: { type: ObjectId, refPath: 'actor.kind' },
    extid: String
  },
  target: {
    kind: String,
    item: { type: ObjectId, refPath: 'target.kind' },
    extid: String
  },
  object: { // Depending on the audit, we need another connection to user, org, item or node
    kind: String,
    item: { type: ObjectId, refPath: 'object.kind' },
    extid: String,
    name: String
  },
  description: { type: String }, // Additional info like: Privacy lvl, new user role, ...
  type: { type: Number, enum: [1, 2, 11, 12, 13, 14, 15, 16, 21, 22, 23, 31, 32, 33, 34, 35, 41, 42, 43, 44, 45, 46, 51, 52, 53, 54, 55, 56], required: true } // Actual situation which triggered the audit
    /*
    Organisation:
    1 - Created ->
    2 - Deleted ->
    11 - New user ->
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
    46 - Item updated ->
    51 - Request contract <->
    52 - Accept contract <->
    53 - Cancel contract <->
    54 - Join contract <->
    55 - Abandon contract <->
    56 - Update contract <->
    User:
    12 - User deleted ->
    13 - User role modified ->
    14 - User metadata modified ->
    15 - User visibility modified ->
    16 - User password modified ->
    */
});

var remember = new Schema({
  token: {type: String, required: true},
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
userAccount.index({cid: 1}, { unique: true });
user.index({name: 1}, { unique: false });
user.index({email: 1}, { unique: true });
// item.index({name: 1, oid: 1}); // Compound indexes cannot be created in the schema definition!
item.index({name: 1}, { unique: false });
item.index({oid: 1}, { unique: true });
node.index({adid: 1}, { unique: true });
contract.index({ctid: 1}, { unique: true });

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
