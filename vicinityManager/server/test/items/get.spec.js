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
var cid;
var uid;
var oid = "5c2f253ca8062e41554cd436";

/*
  Test Notifications possible errors
*/
describe('Notifications test scenario', function(){
  it('Generate token successfully - 200', loginSuccess);
  it('Gets organisation items', getOrgItems);
  it('Gets all items', getAllItems);
  it('Counts items', getCountItems);
  it('Gets user items', getUserItems);
  it('Gets one item', getOneItem);
});

// *************** Functions ***************

function loginSuccess(done){
  var data = {};
  data.username = "admin@admin.com";
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
      res.body.message.should.have.property('cid');
      res.body.message.cid.should.be.a('string');
      res.body.message.should.have.property('uid');
      res.body.message.uid.should.be.a('string');
      token = res.body.message.token;
      cid = res.body.message.cid;
      uid = res.body.message.uid;
      done();
    });
  }

  function getOrgItems(done){
    chai.request(server)
      .get('/items/' + cid  + '/organisation/myItems')
      .set('x-access-token', token)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.should.be.a('array');
        logger.debug("There are " + res.body.message.length + " items");
        done();
      });
  }

  function getAllItems(done){
    chai.request(server)
      .post('/items/' + cid  + '/organisation/allItems')
      .set('x-access-token', token)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.should.be.a('array');
        logger.debug("There are " + res.body.message.length + " items");
        done();
      });
  }

  function getAllItems(done){
    chai.request(server)
      .post('/items/' + cid  + '/organisation/allItems')
      .set('x-access-token', token)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.should.be.a('array');
        logger.debug("There are " + res.body.message.length + " items");
        done();
      });
  }

  function getCountItems(done){
    chai.request(server)
      .get('/items/count/false')
      .set('x-access-token', token)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.should.be.a('object');
        logger.debug("There are " + res.body.message.services + " services and " + res.body.message.devices + " devices");
        done();
      });
  }

  function getUserItems(done){
    chai.request(server)
      .post('/items/user')
      .send({
        reqId: uid,
        reqCid: cid
      })
      .set('x-access-token', token)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.items.should.be.a('array');
        logger.debug("There are " + res.body.message.items.length + " items");
        done();
      });
  }

  function getOneItem(done){
    chai.request(server)
      .get('/items/' + oid)
      .set('x-access-token', token)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.should.be.a('array');
        done();
      });
  }
