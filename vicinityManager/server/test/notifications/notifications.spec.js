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


/*
  Test Notifications possible errors
*/
describe('Notifications test scenario', function(){
  it('Generate token successfully - 200', loginSuccess);
  it('Refreshes notification count', refreshNotifications);
  it('Gets notifications', getNotifications);
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
      done();
    });
  }

  function refreshNotifications(done){
    chai.request(server)
      .get('/notifications/refresh')
      .set('x-access-token', token)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.should.have.property('count');
        res.body.message.count.should.be.a('number');
        done();
      });
  }

  function getNotifications(done){
    chai.request(server)
      .get('/notifications?limit=10&offset=0&all=true')
      .set('x-access-token', token)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.message.should.have.property('notifications');
        res.body.message.notifications.should.be.a('array');
        res.body.message.should.have.property('count');
        res.body.message.count.should.be.a('number');
        done();
      });
  }
