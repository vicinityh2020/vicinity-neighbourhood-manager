//During the test the env variable is set to test
process.env.env = 'test';
process.env.VCNT_MNGR_DB = "mongodb://test:test@138.201.156.73:27017/vicinity_neighbourhood_manager_test";

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
var token, token1, token2;
var login1, login2;
var uid1, uid2;
var adid1, adid2;
var oidDev, oidSer;

// tests
// before(function() {
// });

// TODO test all error codes and special cases
describe('Full test scenario', function(){
  it('Get wrong password error', loginWrongPassword);
  it('Get wrong username error', loginWrongName);
  it('Generate admin token...', loginSuccess);
  // it('it should get body validation error', createOrganisation);
  it('Create a organisation-1', createOrganisation);
  it('Generate organisation-1 token...', loginSuccess);
  it('Get organisation-1 data', getOrganisation);
  it('Get user-1 info', getUser);
  it('Throw nodeNoRoles error', createNodeNoRoles);
  it('Update user name', updateUserMetadata);
  it('Update user-1 roles', updateUserRole1);
  it('Update organisation-1 token, new roles...', loginSuccess);
  it('Update user-1 visibility', updateUserVisibility1);
  it('Throw a nodeNoPassword error', createNodeNoPassword);
  it('Create node-1', createNode1);
  it('Get a deviceErrorWrongAgid when registering', registerDeviceNoAgid);
  it('Get a deviceErrorNoData when registering', registerDeviceNoData);
  it('Register a device', registerDevice);
  it('Enable a device', enableDevice);
  it('it should create a organisation-2', createOrganisation);
  it('Generate company-2 token...', loginSuccess);
  it('Get user-2 info', getUser);
  it('Update user-2 roles', updateUserRole2);
  it('Update user-2 visibility', updateUserVisibility2);
  it('Create node-2', createNode2);
  it('Rregister a service', registerService);
  it('Enable a device', enableService);
  // it('it should not find partnership req', createOrganisation);
  // it('it should request a partnership', createOrganisation);
  // it('it should check partnership requests', createOrganisation);
  // it('it should accept a partnership', createOrganisation);
  // TODO check comm server calls
  // TODO Contracts tests -- change conditions to see reactions (i.e. remove cts)
  it('Remove organisation-1', removeOrganisation1);
  it('Remove organisation-2', removeOrganisation2);
});

// Functions

function loginSuccess(done){
  var data = {};
  var login; // Decides which company should be logging in
  if(!login2){
    if(!login1){ login = "admin@admin.com"; }
    else { login = login1; }
  } else {
    login = login2;
  }
  data.username = login;
  data.password = "password";
  chai.request(server)
      .post('/api/authenticate')
      .send(data)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.should.have.property('token');
        res.body.message.token.should.be.a('string');
        if(login === "admin@admin.com"){
          token = res.body.message.token;
        } else if(login === login1){
          token1 = res.body.message.token;
        } else {
          token2 = res.body.message.token;
        }
        done();
      });
}

function loginWrongPassword(done){
   var data = {
      username: "admin@admin.com",
      password: "wrongPwd"
    };
   chai.request(server)
      .post('/api/authenticate')
      .send(data)
      .end(function(err, res){
        res.should.have.status(401);
        res.body.should.be.a('object');
        done();
      });
}

function loginWrongName(done){
   var data = {
      username: "wrong@wrong.com",
      password: "password"
    };
   chai.request(server)
      .post('/api/authenticate')
      .send(data)
      .end(function(err, res){
        res.should.have.status(404);
        res.body.should.be.a('object');
        done();
      });
}

function createOrganisation(done){
  var data = {
      "user": {
        "userName": "test",
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
      if(!login1){
        login1 = res.body.message.login;
      } else {
        login2 = res.body.message.login;
      }
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

function removeOrganisation1(done){
  //TODO ensure removal was a success
  chai.request(server)
    .delete('/api/organisation')
    .set('x-access-token', token1)
    .end(function(err, res){
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.message.should.have.property('info');
      res.body.message.info.should.be.a('object');
      done();
    });
  }
  function removeOrganisation2(done){
    //TODO ensure removal was a success
    chai.request(server)
      .delete('/api/organisation')
      .set('x-access-token', token2)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.message.should.have.property('info');
        res.body.message.info.should.be.a('object');
        done();
      });
    }

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
    .put('/api/users/' + uid)
    .set('x-access-token', token1)
    .send(data)
    .end(function(err, res){
      res.should.have.status(201);
      res.body.should.be.a('object');
      res.body.should.have.property('success');
      res.body.success.should.equal(true);
      done();
    });
  }

function updateUserVisibility1(done){
  var data = {"data":{
              "accessLevel": 2
            },
            "type": "visibility"};
  chai.request(server)
  .put('/api/users/' + uid1)
  .set('x-access-token', token1)
  .send(data)
  .end(function(err, res){
    res.should.have.status(201);
    res.body.should.be.a('object');
    res.body.should.have.property('success');
    res.body.success.should.equal(true);
    done();
  });
}

function updateUserRole1(done){
var data = {"data":{
              "roles": ['user', 'administrator', 'service provider', 'infrastructure operator', 'system integrator', 'device owner']
            },
            "type": "roles"};
chai.request(server)
  .put('/api/users/' + uid1)
  .set('x-access-token', token1)
  .send(data)
  .end(function(err, res){
    res.should.have.status(201);
    res.body.should.be.a('object');
    res.body.should.have.property('success');
    res.body.success.should.equal(true);
    done();
  });
}

function createNode1(done){
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
      res.should.have.status(202);
      res.body.should.be.a('object');
      res.body.should.have.property('error');
      res.body.error.should.equal(false);
      res.body.should.have.property('message');
      res.body.message.should.be.a('object');
      res.body.message.should.have.property('adid');
      res.body.message.should.have.property('id');
      adid1 = res.body.message.adid;
      done();
    });
  }

  function updateUserVisibility2(done){
    var data = {"data":{
                "accessLevel": 2
              },
              "type": "visibility"};
    chai.request(server)
    .put('/api/users/' + uid2)
    .set('x-access-token', token2)
    .send(data)
    .end(function(err, res){
      res.should.have.status(201);
      res.body.should.be.a('object');
      res.body.should.have.property('success');
      res.body.success.should.equal(true);
      done();
    });
  }

  function updateUserRole2(done){
  var data = {"data":{
                "roles": ['user', 'administrator', 'service provider', 'infrastructure operator', 'system integrator', 'device owner']
              },
              "type": "roles"};
  chai.request(server)
    .put('/api/users/' + uid2)
    .set('x-access-token', token2)
    .send(data)
    .end(function(err, res){
      res.should.have.status(201);
      res.body.should.be.a('object');
      res.body.should.have.property('success');
      res.body.success.should.equal(true);
      done();
    });
  }

  function createNode2(done){
    var data = {
      "name": "testAgent2",
      "type": "sharq",
      "password": "password"
    };
    chai.request(server)
      .post('/api/agents')
      .set('x-access-token', token2)
      .send(data)
      .end(function(err, res){
        res.should.have.status(202);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        res.body.error.should.equal(false);
        res.body.should.have.property('message');
        res.body.message.should.be.a('object');
        res.body.message.should.have.property('adid');
        res.body.message.should.have.property('id');
        adid2 = res.body.message.adid;
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
    chai.request(server)
      .post('/commServer/items/register')
      .send(data)
      .end(function(err, res){
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        res.body.error.should.equal(false);
        res.body.should.have.property('message');
        res.body.message.should.be.a('array');
        oidDev = res.body.message[0]["nm-id"];
        done();
      });
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
      chai.request(server)
        .post('/commServer/items/register')
        .send(data)
        .end(function(err, res){
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal(false);
          res.body.should.have.property('message');
          res.body.message.should.be.a('array');
          oidSer = res.body.message[0]["nm-id"];
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
      "adid": adid
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

function enableDevice(done){
var data = {
              "o_id": oidDev,
              "typeOfItem": "device",
              "status": "enabled"
            };
chai.request(server)
  .put('/api/items')
  .set('x-access-token', token1)
  .send(data)
  .end(function(err, res){
    res.should.have.status(200);
    res.body.should.be.a('object');
    done();
  });
}

function enableService(done){
var data = {
              "o_id": oidSer,
              "typeOfItem": "device",
              "status": "enabled"
            };
chai.request(server)
  .put('/api/items')
  .set('x-access-token', token2)
  .send(data)
  .end(function(err, res){
    res.should.have.status(200);
    res.body.should.be.a('object');
    done();
  });
}
