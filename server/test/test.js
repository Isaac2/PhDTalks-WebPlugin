//Tests for Microservice routes
process.env.NODE_ENV = "debug"; //Tests must run on debug enviroment

var should = require('should');
require('should-http');
var request = require('supertest');
var config = require('../server/config/enviroment');

describe('Task Microservice', function() {
	var url = 'http://localhost:'+5000+'/api'/file;


	describe('Routes',function(){
		describe('Create', function() {
			it('should return error if missing Title', function (done){



			});
		});

	});

});