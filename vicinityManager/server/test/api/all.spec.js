//Require the dev-dependencies
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../../app');
var should = chai.should();
var logger = require("../../middlewares/logger");
var userOp = require('../../models/vicinityManager').user;
var userAccountsOp = require('../../models/vicinityManager').userAccount;
var jwt = require('../../services/jwtHelper');
var mongoose = require('mongoose');
var uuid = require('uuid');

chai.use(chaiHttp);

// Global variables
var token, token1, token2; // Auth token for 3 orgs involved (Admin, org1, org2)
var login1, login2; // Login ids of org1 and org2
var uid1, uid2; // user ids of org1 and org2
var cid1, cid2; // company id of org1 and org2
var adid1, adid2, adidtest; // agent id of org1 and org2
var oidDev, oidSer, oidDev_ext, oidSer_ext; // device and service id
var ctObj = {}; // contract post request object
var ctid; // contract id

// tests
// before(function() {
// });

/*
  This test scenario represents the normal basic behaviour of a new organsation.
  -  Register ORGANISATION
  -  Register AGENT
  -  Register ITEMS
  -  Make FRIENDSHIPS
  -  Create CONTRACTS
  -  Remove ALL
*/
describe('Full test scenario', function(){
  it('Generate admin token...', loginSuccess);
  describe('Creating organisation 1 + test errors...', function(){
    it('Error body validation creating organisation', createOrganisationErrorBody);
    it('Create a organisation-1', createOrganisation);
    it('Generate organisation-1 token...', loginSuccess1);
    it('Get organisation-1 data', getOrganisation);
    it('Get unauthorized', getOrganisationUnauth);
  });
  describe('Setting user 1 + test errors...', function(){
    it('Get user-1 info', getUser);
    it('Throw nodeNoRoles error', createNodeNoRoles);
    it('Update user name', updateUserMetadata);
    it('Update user-1 roles', updateUserRole1);
    it('Update organisation-1 token, new roles...', loginSuccess1);
    it('Update user-1 visibility', updateUserVisibility1);
  });
  describe('Setting infrastructure 1 + test errors...', function(){
    it('Throw a nodeNoPassword error', createNodeNoPassword);
    it('Create node-1', createNode1);
    it('Create node-to-delete', createNodeTest);
    it('Remove node-to-delete', removeNodeTest);
    it('Remove node-to-delete not found', removeNodeTestNotFound);
    it('Get a deviceErrorWrongAgid when registering', registerDeviceNoAgid);
    it('Get a deviceErrorNoData when registering', registerDeviceNoData);
    it('Get agent items not found error', getAgentItemsNotFound);
    it('Register a device', registerDevice);
    it('Get agent items successfully', getAgentItemsSuccess);
    it('Fails to update an item', itemFailedUpdate);
    it('Enable a device', enableDevice);
    it('Update metadata from agent - update call', updateDeviceTd_onlyMetadata);
    it('Do multiple update', multipleUpdate);
  });
  describe('Creating organisation 2...', function(){
    it('Create a organisation-2', createOrganisation);
    it('Generate company-2 token...', loginSuccess2);
  });
  describe('Setting user 2...', function(){
    it('Get user-2 info', getUser);
    it('Update user-2 roles', updateUserRole2);
    it('Update user-2 visibility', updateUserVisibility2);
    it('Update organisation-2 token, new roles...', loginSuccess2);
  });
  describe('Setting infrastructure 2 + test error...', function(){
    it('Get agent items unauthorized error', getAgentItemsUnauthorized);
    it('Create node-2', createNode2);
    it('Register a service', registerService);
    it('Enable a service', enableService);
    it('Fails to update visibility - unauthorized', itemFailedUnauthorized);
    it('Update device visibility', updateDeviceVisibility);
    it('Update service visibility', updateServiceVisibility);
  });
  describe('Making partnership + test errors...', function(){
    it('Not find any friends', notFindFriends);
    it('Not find partnership req', notFoundFriendship);
    it('Error no friendship to cancel', cancelFriendshipError);
    it('Request a partnership', postFriendship);
    it('Error already requesting a partnership', postFriendshipError);
    it('Find partnership requests', getFriendship);
    it('Accept a partnership', acceptFriendship);
    it('Error already friends', postFriendshipError);
    it('Error already friends, cannot reject', rejectFriendshipError);
    it('Error wrong friendship type', wrongFriendshipType);
    it('Error already accepted friendship', acceptFriendshipError);
    it('Find any friends', findFriends);
  });
  describe('Making contract + test errors...', function(){
    it('Not found contract req', notFoundContract);
    it('Find devices I can share with the service', getContractValidItems);
    it('Get my friend info I need to create the contract', getFriendContractingInfo);
    it('Request a contract (CTID)', postContract);
    it('Find contract requests (CTID)', getContractReqCtidUser2);
    it('Accept a contract (CTID)', acceptContractUser2);
    it('Request a contract duplicated error 400', postContractDuplicated);
    it('Update item TD and put contract on hold - modify call', updateDeviceTd);
    it('Find the contract put in hold', getContractReqCtidUser1);
    it('Re-accept contract on hold', acceptContractUser1);
    it('Delete a contract', deleteContract);
    it('Not found contract req', notFoundContract);
    // TODO debug('If next line fails consider race condition caused by test suite - fails only sometimes');
    // it('Request a contract (MONGO ID)', postContract);
    // it('Find contract requests (MONGO ID)', getContractReq);
    // it('Accept a contract (MONGO ID)', acceptContractUser2);
  });
  describe('Remove organisations...', function(){
    it('Remove organisation-1', removeOrganisation1);
    it('Remove organisation-2', removeOrganisation2);
  });
});

// *************** Functions ***************

/*
 LOGIN scenarios
*/

function loginSuccess(done){
  var data = {};
  data.username = "admin@admin.com";
  data.password = "password";
  login(data, 0, done);
}

function loginSuccess1(done){
  var data = {};
  data.username = login1;
  data.password = "password";
  login(data, 1, done);
}

function loginSuccess2(done){
  var data = {};
  data.username = login2;
  data.password = "password";
  login(data, 2, done);
}

function login(data, org, done){
  chai.request(server)
    .post('/api/authenticate')
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('message');
      res.body.message.should.have.property('token');
      res.body.message.token.should.be.a('string');
      res.body.message.should.have.property('cid');
      res.body.message.cid.should.be.a('string');
      res.body.message.should.have.property('uid');
      res.body.message.uid.should.be.a('string');
      if(org === 0){token = res.body.message.token;}
      else if(org === 1){
        token1 = res.body.message.token;
        cid1 = res.body.message.cid;
      }
      else{
        token2 = res.body.message.token;
        cid2 = res.body.message.cid;
      }
      done();
    });
  }

/*
 ORGANISATION scenarios
*/

function createOrganisation(done){
  var data = {
      "user": {
        "userName": "test_" + uuid(),
        "contactMail": "test@test.com",
        "occupation": "test",
        "password": "password"
      },
      "organisation": {
        "companyName": "test_" + uuid(),
        "companyLocation": "test"
      }
    };
  chai.request(server)
    .post('/api/organisation/auto')
    .set('x-access-token', token)
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.message.should.have.property('login');
      res.body.message.login.should.be.a('string');
      if(!login1){ // If the first org has been created, store the second login
        login1 = res.body.message.login;
      } else {
        login2 = res.body.message.login;
      }
      done();
    });
  }

  function createOrganisationErrorBody(done){
    var data = {
        "user": {
          "userName": "test"
        },
        "organisation": {
          "companyName": "test_" + uuid(),
          "companyLocation": "test"
        }
      };
    chai.request(server)
      .post('/api/organisation/auto')
      .set('x-access-token', token)
      .send(data)
      .end(function(err, res){
        res.should.have.status(400);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        res.body.error.should.equal(true);
        done();
      });
  }

  function getOrganisation(done){
    chai.request(server)
      .get('/api/organisation')
      .set('x-access-token', token1)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.message.should.have.property('cid');
        res.body.message.cid.should.be.a('string');
        done();
      });
    }

  function getOrganisationUnauth(done){
    chai.request(server)
      .get('/api/organisation')
      .end(function(err, res){
        res.should.have.status(401);
        done();
      });
    }

function removeOrganisation1(done){
  //TODO ensure removal was a success
  removeOrg(token1, done);
}

function removeOrganisation2(done){
  //TODO ensure removal was a success
  removeOrg(token2, done);
}

function removeOrg(token, done){
  chai.request(server)
    .delete('/api/organisation')
    .set('x-access-token', token)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.message.should.have.property('info');
      res.body.message.info.should.be.a('object');
      done();
    });
}

/*
 USER scenarios
*/

// Gets and stores uid of user 1 and then user 2
function getUser(done){
  var token = token2 || token1;
  chai.request(server)
    .get('/api/users')
    .set('x-access-token', token)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.message.should.have.property('_id');
      res.body.message._id.should.be.a('string');
      res.body.message.should.have.property('cid');
      res.body.message.cid.should.be.a('object');
      res.body.message.should.have.property('email');
      res.body.message.email.should.be.a('string');
      res.body.message.should.have.property('authentication');
      res.body.message.authentication.should.be.a('object');
      if(!uid1){
        uid1 = res.body.message._id;
      } else {
        uid2 = res.body.message._id;
      }
      done();
    });
  }

function updateUserMetadata(done){
  var data = {"data":{
                "name": "newName"
              },
              "type": "metadata"};
  chai.request(server)
    .put('/api/users/' + uid1)
    .set('x-access-token', token1)
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('success');
      res.body.success.should.equal(true);
      done();
    });
  }

function updateUserVisibility1(done){
  var data =
  {"data":{
    "accessLevel": 2
  },
  "type": "visibility"};
  updVisibility(data, uid1, token1, done);
}

function updateUserVisibility2(done){
  var data =
  {"data":{
    "accessLevel": 2
  },
  "type": "visibility"};
  updVisibility(data, uid2, token2, done);
}

function updVisibility(data, uid, token, done){
  chai.request(server)
  .put('/api/users/' + uid)
  .set('x-access-token', token)
  .send(data)
  .end(function(err, res){
    res.should.have.status(200);
    res.body.should.be.a('object');
    res.body.should.have.property('success');
    res.body.success.should.equal(true);
    done();
  });
}

function updateUserRole1(done){
  var data =
  {"data":{
    "roles": ['user', 'administrator', 'service provider', 'infrastructure operator', 'system integrator', 'device owner']
  },
  "type": "roles"};
  updRole(data, uid1, token1, done);
}

function updateUserRole2(done){
  var data =
  {"data":{
    "roles": ['user', 'administrator', 'service provider', 'infrastructure operator', 'system integrator', 'device owner']
  },
  "type": "roles"};
  updRole(data, uid2, token2, done);
}

function updRole(data, uid, token, done){
  chai.request(server)
    .put('/api/users/' + uid)
    .set('x-access-token', token)
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('success');
      res.body.success.should.equal(true);
      done();
    });
}

/*
 AGENT scenarios
*/

function createNodeTest(done){
  var data = {
    "name": "RemoveAgent",
    "type": "sharq",
    "password": "password"
  };
  createNode(data, 0, done);
  }

function createNode1(done){
  var data = {
    "name": "testAgent",
    "type": "sharq",
    "password": "password"
  };
  createNode(data, 1, done);
  }

  function createNode2(done){
    var data = {
      "name": "testAgent2",
      "type": "sharq",
      "password": "password"
    };
    createNode(data, 2, done);
    }

  function createNode(data, org, done){
    var token;
    if(org <= 1){ token = token1;}
    else{token = token2;}
    chai.request(server)
      .post('/api/agents')
      .set('x-access-token', token)
      .send(data)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        res.body.error.should.equal(false);
        res.body.should.have.property('message');
        res.body.message.should.be.a('object');
        res.body.message.should.have.property('adid');
        res.body.message.should.have.property('id');
        if(org === 1){ adid1 = res.body.message.adid; }
        if(org === 0){ adidtest = res.body.message.id; } // Test to remove (using mongoId)
        else{ adid2 = res.body.message.adid; }
        done();
      });
  }

function createNodeNoRoles(done){
  var data = {
    "name": "testAgent",
    "type": "sharq",
    "password": "password"
  };
  chai.request(server)
    .post('/api/agents')
    .set('x-access-token', token1)
    .send(data)
    .end(function(err, res){
      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('error');
      res.body.error.should.equal(false);
      done();
    });
  }

function createNodeNoPassword(done){
  var data = {
    "name": "testAgent",
    "type": "sharq"
  };
  chai.request(server)
    .post('/api/agents')
    .set('x-access-token', token1)
    .send(data)
    .end(function(err, res){
      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('error');
      res.body.error.should.equal(false);
      done();
    });
  }

function removeNodeTest(done){
  chai.request(server)
    .delete("/api/agents/" + adidtest)
    .set('x-access-token', token1)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      done();
    });
}

function removeNodeTestNotFound(done){
  chai.request(server)
    .delete("/api/agents/" + adidtest)
    .set('x-access-token', token1)
    .end(function(err, res){
      res.should.have.status(404);
      res.body.should.be.a('object');
      done();
    });
}

function getAgentItemsSuccess(done){
  getAgentItems(token1, adid1, 200, done);
}

function getAgentItemsNotFound(done){
  getAgentItems(token1, "1234-5678-90", 404, done);
}

function getAgentItemsUnauthorized(done){
  getAgentItems(token2, adid1, 401, done);
}

function getAgentItems(token, adid, code, done){
  chai.request(server)
    .get("/api/agents/" + adid + "/items")
    .set('x-access-token', token)
    .end(function(err, res){
      res.should.have.status(code);
      res.body.should.be.a('object');
      done();
    });
  }


/*
 ITEM scenarios
*/

function registerDevice(done){
  var data = {
    "adid":adid1,
    "thingDescriptions":[
      {
      "name" : "testDev",
      "type" : "core:Device",
      "infrastructure-id": "testDev",
      "adapter-id": "testDev",
      "actions" : [],
      "properties" : [],
      "events": []
      }
    ]};
    registerItem(data, "dev", done);
  }

function registerService(done){
  var data = {
    "adid": adid2,
    "thingDescriptions":[
      {
      "name" : "testServ",
      "type" : "core:Service",
      "infrastructure-id": "testServ",
      "adapter-id": "testServ",
      "actions" : [],
      "properties" : [],
      "events": []
      }
    ]};
    registerItem(data, "ser", done);
  }

  function registerItem(data, type, done){
    chai.request(server)
      .post('/commServer/items/register')
      .send(data)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        res.body.error.should.equal(false);
        res.body.should.have.property('message');
        res.body.message.should.be.a('array');
        if(type === "dev"){
          oidDev = res.body.message[0]["nm-id"];
          oidDev_ext = res.body.message[0].oid;
        } else{
          oidSer = res.body.message[0]["nm-id"];
          oidSer_ext = res.body.message[0].oid;
       }
        done();
      });
    }

function registerDeviceNoAgid(done){
var data = {
  "thingDescriptions":[
    {
    "name" : "testDev",
    "type" : "core:Device",
    "infrastructure-id": "testDev",
    "adapter-id": "testDev",
    "actions" : [],
    "properties" : [],
    "events": []
    }
  ]};
chai.request(server)
  .post('/commServer/items/register')
  .send(data)
  .end(function(err, res){
    res.should.have.status(400);
    res.body.should.be.a('object');
    done();
  });
}

function registerDeviceNoData(done){
  var data = {
    "adid": adid1
    };
  chai.request(server)
    .post('/commServer/items/register')
    .send(data)
    .end(function(err, res){
      res.should.have.status(400);
      res.body.should.be.a('object');
      done();
    });
  }

  function updateDeviceTd(done){
  var data = {
    "adid": adid1,
    "thingDescriptions": [
        {
            "name": "anyNewName",
            "oid": oidDev_ext,
            "type": "core:Device",
            "infrastructure-id": "testtest",
            "adapter-id": "newAdaptId",
            "actions": [],
            "properties": [],
            "events": []
        }
    ]};
  chai.request(server)
    .put('/commServer/items/modify')
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('error');
      res.body.error.should.equal(false);
      done();
    });
  }

  function updateDeviceTd_onlyMetadata(done){
  var data = {
    "adid": adid1,
    "thingDescriptions": [
        {
            "name": "anyNewName",
            "oid": oidDev_ext,
            "type": "core:Device",
            "infrastructure-id": "testtest",
            "adapter-id": "newAdaptId",
            "actions": [],
            "properties": [],
            "events": []
        }
    ]};
  chai.request(server)
    .put('/commServer/items/update')
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('error');
      res.body.error.should.equal(false);
      done();
    });
  }

function multipleUpdate(done){
  var data = {
    "items":[{
      "o_id": oidDev,
      "typeOfItem": "device",
      "status": "enabled"
    },
    {
      "o_id": oidDev,
      "typeOfItem": "device",
      "accessLevel": 0
    }
  ],
    "multi": true
  };
  chai.request(server)
    .put('/api/items')
    .set('x-access-token', token1)
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('error');
      res.body.error.should.equal(false);
      done();
    });
}

function enableDevice(done){
  enabling(token1, "device", done);
}

function enableService(done){
  enabling(token2, "service", done);
}

function enabling(token, type, done){
  var oid = type === "device" ? oidDev : oidSer;
  var data = {
                "o_id": oid,
                "typeOfItem": type,
                "status": "enabled"
              };
  chai.request(server)
    .put('/api/items')
    .set('x-access-token', token)
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      done();
    });
  }

function updateDeviceVisibility(done){
  visibilityUpdate(token1, "device", done);
}

function updateServiceVisibility(done){
  visibilityUpdate(token2, "service", done);
}

function visibilityUpdate(token, type, done){
  var oid = type === "device" ? oidDev : oidSer;
  var data = {
                "o_id": oid,
                "typeOfItem": type,
                "accessLevel": 2
              };
  chai.request(server)
    .put('/api/items')
    .set('x-access-token', token)
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      done();
    });
  }

  function itemFailedUpdate(done){
    var data = {
                  "o_id": oidDev
                };
    chai.request(server)
      .put('/api/items')
      .set('x-access-token', token1)
      .send(data)
      .end(function(err, res){
        res.should.have.status(400);
        res.body.should.be.a('object');
        done();
      });
    }

  function itemFailedUnauthorized(done){
    var data = {
                  "o_id": oidSer,
                  "typeOfItem": "service",
                  "accessLevel": 2
                };
    chai.request(server)
      .put('/api/items')
      .set('x-access-token', token1)
      .send(data)
      .end(function(err, res){
        res.should.have.status(401);
        res.body.should.be.a('object');
        done();
      });
    }

/*
 FRIENDSHIP scenarios
*/

function postFriendship(done){
  var data = {
    "id": cid2
  };
  chai.request(server)
    .post('/api/partnership')
    .set('x-access-token', token1)
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.message.should.be.a('string');
      res.body.message.should.equal("Friend request sent");
      done();
    });
  }

  function postFriendshipError(done){
    var data = {
      "id": cid2
    };
    chai.request(server)
      .post('/api/partnership')
      .set('x-access-token', token1)
      .send(data)
      .end(function(err, res){
        res.should.have.status(400);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        done();
      });
    }

function getFriendship(done){
  chai.request(server)
    .get('/api/partnership')
    .set('x-access-token', token2)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.message.should.have.property('requestsReceived');
      res.body.message.requestsReceived.should.be.a('array');
      res.body.message.should.have.property('sentRequests');
      res.body.message.sentRequests.should.be.a('array');
      res.body.message.requestsReceived[0].should.be.a('object');
      res.body.message.requestsReceived[0].should.have.property('id');
      res.body.message.requestsReceived[0].id._id.should.equal(cid1);
      done();
    });
  }

function acceptFriendship(done){
  var data = {
    "id": cid1,
    "type": "accept"
  };
  chai.request(server)
    .put('/api/partnership')
    .set('x-access-token', token2)
    .send(data)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.message.should.be.a('string');
      res.body.message.should.equal("Friendship accepted");
      done();
    });
  }

  function acceptFriendshipError(done){
    var data = {
      "id": cid1,
      "type": "accept"
    };
    chai.request(server)
      .put('/api/partnership')
      .set('x-access-token', token2)
      .send(data)
      .end(function(err, res){
        res.should.have.status(400);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        done();
      });
    }

function cancelFriendshipError(done){
  var data = {
    "id": cid1,
    "type": "cancel"
  };
  chai.request(server)
    .put('/api/partnership')
    .set('x-access-token', token2)
    .send(data)
    .end(function(err, res){
      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.message.should.be.a('string');
      done();
    });
  }

function rejectFriendshipError(done){
  var data = {
    "id": cid1,
    "type": "reject"
  };
  chai.request(server)
    .put('/api/partnership')
    .set('x-access-token', token2)
    .send(data)
    .end(function(err, res){
      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.message.should.be.a('string');
      done();
    });
  }

function wrongFriendshipType(done){
  var data = {
    "id": cid1,
    "type": "wrongType"
  };
  chai.request(server)
    .put('/api/partnership')
    .set('x-access-token', token2)
    .send(data)
    .end(function(err, res){
      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.message.should.be.a('string');
      res.body.message.should.equal("Wrong type");
      done();
    });
  }

  function notFoundFriendship(done){
    chai.request(server)
      .get('/api/partnership')
      .set('x-access-token', token2)
      .end(function(err, res){
        res.should.have.status(404);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        res.body.error.should.equal(false);
        done();
      });
    }

function findFriends(done){
  chai.request(server)
    .get('/api/organisation/friends')
    .set('x-access-token', token1)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('error');
      res.body.error.should.equal(false);
      done();
    });
}

function notFindFriends(done){
  chai.request(server)
    .get('/api/organisation/friends')
    .set('x-access-token', token1)
    .end(function(err, res){
      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('error');
      res.body.error.should.equal(false);
      done();
    });
}

/*
 CONTRACT scenarios
*/

  function notFoundContract(done){
    chai.request(server)
      .get('/api/contract')
      .set('x-access-token', token2)
      .end(function(err, res){
        res.should.have.status(404);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        res.body.error.should.equal(false);
        done();
      });
  }

  function getContractValidItems(done){
    var data = {};
    chai.request(server)
      .get('/api/contract/validItems/' + cid2 + "/" + oidSer)
      .set('x-access-token', token1)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        // Start Building contract req obj
        data = res.body.message[0];
        ctObj.readWrite = false;
        ctObj.cidDevice = {id: data.cid.id._id, extid: data.cid.extid, name: data.cid.id.name};
        ctObj.uidsDevice = [{ id: data.uid.id ,extid: data.uid.extid}];
        ctObj.oidsDevice = [{ id: data._id, extid: data.oid, name: data.name}];
        done();
      });
  }

  function getFriendContractingInfo(done){
    var data = {};
    chai.request(server)
      .get('/api/organisation/' + cid2 + "/items")
      .set('x-access-token', token1)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        // Finish Building contract req obj
        data = res.body.message[0];
        ctObj.cidService = {id: data.cid.id._id, extid: data.cid.extid, name: data.cid.id.name};
        ctObj.uidsService = [{ id: data.uid.id ,extid: data.uid.extid}];
        ctObj.oidsService = [{ id: data._id, extid: data.oid, name: data.name}];
        ctObj.contractingUser = {id: data.uid.id ,extid: data.uid.extid};
        done();
      });
  }

  function postContract(done){
    chai.request(server)
      .post('/api/contract')
      .set('x-access-token', token1)
      .send(ctObj)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.equal('Contract posted, waiting for approval');
        done();
      });
  }

  function postContractDuplicated(done){
    chai.request(server)
      .post('/api/contract')
      .set('x-access-token', token1)
      .send(ctObj)
      .end(function(err, res){
        res.should.have.status(400);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.equal('Contract duplicated');
        done();
      });
  }

  function getContractReqCtidUser1(done){
    getContractReqCtid(token1, done);
  }

  function getContractReqCtidUser2(done){
    getContractReqCtid(token2, done);
  }

  function getContractReqCtid(token, done){
    chai.request(server)
      .get('/api/contract')
      .set('x-access-token', token)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.should.be.a('array');
        ctid = res.body.message[0].extid;
        done();
      });
  }

  function getContractReq(done){
    chai.request(server)
      .get('/api/contract')
      .set('x-access-token', token2)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.should.be.a('array');
        ctid = res.body.message[0].id;
        done();
      });
  }

  function acceptContractUser1(done){
    acceptContract(token1, done);
  }

  function acceptContractUser2(done){
    acceptContract(token2, done);
  }

  function acceptContract(token, done){
    var data = {
      "type": "accept"
    };
    chai.request(server)
      .put('/api/contract/' + ctid)
      .set('x-access-token', token)
      .send(data)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.message.should.be.a('string');
        res.body.message.should.equal('Contract accepted');
        done();
      });
    }

    function deleteContract(done){
      var data = {
        "type": "delete"
      };
      chai.request(server)
        .put('/api/contract/' + ctid)
        .set('x-access-token', token2)
        .send(data)
        .end(function(err, res){
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.message.should.be.a('string');
          res.body.message.should.equal('Contract successfully removed');
          done();
        });
      }
