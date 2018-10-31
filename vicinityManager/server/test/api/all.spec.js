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
var token;
var login;
var uid;
var adid;

// tests
// before(function() {
// });

// TODO test all error codes and special cases
describe('Full test scenario', function(){
  it('Get wrong password error', loginWrongPassword);
  it('Get wrong username error', loginWrongName);
  it('Generate admin token...', loginSuccess);
  // it('it should get body validation error', createOrganisation);
  it('it should create a organisation-1', createOrganisation);
  it('Generate company-1 token...', loginSuccess);
  it('it should get a organisation', getOrganisation);
  it('it should get user info', getUser);
  it('it should throw a nodeNoRoles error', createNodeNoRoles);
  it('it should update user-1 name', updateUserMetadata);
  it('it should update user-1 roles', updateUserRole);
  it('Update company-1 token, new roles...', loginSuccess);
  it('it should update user-1 visibility', updateUserVisibility);
  it('it should throw a nodeNoPassword error', createNodeNoPassword);
  it('it should create node-1', createNode);
  // it('it should get a deviceErrorNoRoles', );
  // it('it should get a deviceErrorWrongAgid', );
  // it('it should register a device', );
  // it('it should create a organisation-2', createOrganisation);
  // it('Generate company-2 token...', loginSuccess);
  // it('it should not find partnership req', createOrganisation);
  // it('it should request a partnership', createOrganisation);
  // it('it should check partnership requests', createOrganisation);
  // it('it should accept a partnership', createOrganisation);
  // it('it should update user-2 roles', updateUserRole);
  // it('it should update user-2 visibility', updateUserVisibility);
  // it('it should create node-2', createNode);
  // it('it should register a service', );
  // TODO check comm server calls
  // TODO Contracts tests -- change conditions to see reactions (i.e. remove cts)
  it('it should remove a organisation-1', removeOrganisation);
  // it('it should remove a organisation-2', removeOrganisation);
});

// Functions

function loginSuccess(done){
  var data = {};
  data.username = login || "admin@admin.com";
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
        token = res.body.message.token;
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
      login = res.body.message.login;
      done();
    });
  }

  function getOrganisation(done){
    chai.request(server)
      .get('/api/organisation')
      .set('x-access-token', token)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.message.should.have.property('cid');
        res.body.message.cid.should.be.a('string');
        done();
      });
    }

function removeOrganisation(done){
  //TODO ensure removal was a success
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

function getUser(done){
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
      uid = res.body.message._id;
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
    .set('x-access-token', token)
    .send(data)
    .end(function(err, res){
      res.should.have.status(201);
      res.body.should.be.a('object');
      res.body.should.have.property('success');
      res.body.success.should.equal(true);
      done();
    });
  }

function updateUserVisibility(done){
  var data = {"data":{
              "accessLevel": 2
            },
            "type": "visibility"};
  chai.request(server)
  .put('/api/users/' + uid)
  .set('x-access-token', token)
  .send(data)
  .end(function(err, res){
    res.should.have.status(201);
    res.body.should.be.a('object');
    res.body.should.have.property('success');
    res.body.success.should.equal(true);
    done();
  });
}

function updateUserRole(done){
var data = {"data":{
              "roles": ['user', 'administrator', 'service provider', 'infrastructure operator', 'system integrator', 'device owner']
            },
            "type": "roles"};
chai.request(server)
  .put('/api/users/' + uid)
  .set('x-access-token', token)
  .send(data)
  .end(function(err, res){
    res.should.have.status(201);
    res.body.should.be.a('object');
    res.body.should.have.property('success');
    res.body.success.should.equal(true);
    done();
  });
}

function createNode(done){
  var data = {
    "name": "testAgent",
    "type": "vicinity",
    "password": "password"
  };
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
      done();
    });
  }

  function createNodeNoRoles(done){
    var data = {
      "name": "testAgent",
      "type": "vicinity",
      "password": "password"
    };
    chai.request(server)
      .post('/api/agents')
      .set('x-access-token', token)
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
        "type": "vicinity"
      };
      chai.request(server)
        .post('/api/agents')
        .set('x-access-token', token)
        .send(data)
        .end(function(err, res){
          res.should.have.status(400);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          res.body.error.should.equal(false);
          done();
        });
      }
