//During the test the env variable is set to test
process.env.env = 'test';
process.env.VCNT_MNGR_DB = "mongodb://vicinityUser:Nuevaheslopl4tf0rm@138.201.156.73:27017/vicinity_neighbourhood_manager";

var mongoose = require("mongoose");
var logger = require("../../middlewares/logger");

//Require the dev-dependencies
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../../app.js');
var should = chai.should();

chai.use(chaiHttp);

/*
  * Test the /GET route
  */
  describe('/authenticate endpoint', function(){
      it('it should return a token', function(done){
        var data = {
              username: "john.johnson@bavenir.eu",
              password: "johnadmi"
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
      });
  });
