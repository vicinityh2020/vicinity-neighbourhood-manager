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

// tests
// before(function() {
// });

describe('Organisation test scenarios', function(){
  it('Generate token...', loginSuccess);
  it('it should create a organisation', createOrganisation);
  it('Generate new token...', loginSuccess);
  it('it should get a organisation', getOrganisation);
  it('it should remove a organisation', removeOrganisation);
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
