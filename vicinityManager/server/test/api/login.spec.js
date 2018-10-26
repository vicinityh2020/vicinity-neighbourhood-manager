//During the test the env variable is set to test
process.env.env = 'test';
process.env.VCNT_MNGR_DB = "mongodb://test:test@138.201.156.73:27017/vicinity_neighbourhood_manager_test";

//Require the dev-dependencies
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../../app');
var should = chai.should();
var logger = require("../../middlewares/logger");

chai.use(chaiHttp);

// tests
describe('Test login scenarios', function(){
  it('it should return a token', loginSuccess);
  it('it should return 401', loginWrongPassword);
});

// Functions

function loginSuccess(done){
  var data = {
     username: "admin@admin.com",
     password: "test"
   };
  chai.request(server)
      .post('/api/authenticate')
      .send(data)
      .end(function(err, res){
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        res.body.should.have.property('error');
        res.body.message.should.have.property('token');
        res.body.message.token.should.be.a('string');
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
