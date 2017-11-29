// Global variables and definitions =========

var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

var Schema = mongoose.Schema;

// Vicinity neighorhood schemas ============

// TODO Remove unnecesary joins between schemas (ref:)

var userAccount = new Schema({
  organisation: String,
  avatar: String,
  creatorOf: [ObjectId], //Creator of UserAccounts
  follows: [ObjectId], //Follows UserAccounts
  memberOf: [ObjectId], //Member of UserGroups
  location: String,
  businessId : String,
  skinColor: {type: String, enum: ['blue', 'red', 'green', 'purple', 'yellow', 'black']},
  accountOf: [
    { type: ObjectId, ref: 'user'}
  ],
  knows: [
    { type: ObjectId, ref: 'userAccount'}
  ],
  knowsRequestsFrom: [
    { type: ObjectId, ref: 'userAccount'}
  ],
  knowsRequestsTo: [
    { type: ObjectId, ref: 'userAccount'}
  ],
  hasNotifications: [
    { type: ObjectId, ref: 'notification'}
  ],
  hasNodes: [String],
  modifierOf: [ObjectId], //UserAccount is modifier of Item, Container or Space
  administratorOf: [ObjectId], //UserAccount is administrator of Item, Container or Space
  // badges:[String],
  notes:String,
  status:String
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
  organisation: { type: ObjectId, ref: 'userAccount' },
  authentication: {
    password: String,
    principalRoles: [String]
  }
});

var node = new Schema({
  adid: {type: String, required: true},
  name: {type: String, required: true},
  eventUri: String,
  organisation: { type: ObjectId, ref: 'userAccount' },
  type: [String],
  agent: String,
  status: String,
  hasItems: [String]
});

var item = new Schema({
  name: String,
  oid: String, // Object id -- different to Mongo uid
  adid: String, // Agent id
  hasAdministrator: [{type: ObjectId, ref: 'userAccount'}],
  hasAccess: [{type: ObjectId, ref: 'userAccount'}],
  accessRequestFrom: [{type: ObjectId, ref: 'userAccount'}],
  accessLevel: Number,
  avatar: String,
  info: mongoose.Schema.Types.Mixed, // Thing description, object with flexible schema
  typeOfItem: {type: String, enum: ['device','service']},
  status: String // Enabled or disabled
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
  auditId: {type: String, required: true}, // Can be oid or cid
  data: [ {
    creationDate: { type: Date, default: Date.now },
    triggeredByMe: { type: Boolean, default: true }, // Was the audit triggered by an event in your organisation??
    user: { type: String, default: "Unknown" }, // User generating the event
    orgOrigin: { type: ObjectId, ref: 'userAccount' }, // Organisation generating the event
    orgDest: { type: ObjectId, ref: 'userAccount' }, // Organisation receiving the event
    // Depending on the audit, we need another connection to user, org, item or node
    auxConnection: {
    kind: String,
    item: { type: ObjectId, refPath: 'auxConnection.kind' }
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

// Converts the mongoose document into a plain javascript object
userAccount.set('toJSON',{ getters: true, virtuals: false });
user.set('toJSON',{ getters: true, virtuals: false });
item.set('toJSON',{ getters: true, virtuals: false });
notification.set('toJSON',{ getters: true, virtuals: false });
invitation.set('toJSON',{ getters: true, virtuals: false });
registration.set('toJSON',{ getters: true, virtuals: false });
remember.set('toJSON',{ getters: true, virtuals: false });
node.set('toJSON',{ getters: true, virtuals: false });
auditLog.set('toJSON',{ getters: true, virtuals: false });

// Ensures that values passed to our model constructor that
// were not specified in our schema do not get saved to the db
// Set to true by default
// userAccount.set('strict',true);
// ...

// Indexes to perform text search =======================

/* Only works for FULL TEXT search !!!!
userAccount.index({organisation: 'text'});
user.index({name: 'text'});
item.index({name: 'text'}); */

// Indexes for common field searchUser  =================
// TODO set the index as unique once server side and agent are prepared
userAccount.index({organisation: 1}, { unique: false });
user.index({name: 1}, { unique: false });
// item.index({name: 1, oid: 1}); // Compound indexes cannot be created in the schema definition!
item.index({oid: 1}, { unique: false });
item.index({name: 1}, { unique: false });
node.index({adid: 1}, { unique: false });
auditLog.index({auditId: 1}, { unique: true});


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
