var express = require('express');
var router = express.Router();

//oauth modules
var passport = require('passport');
var oauth2 = require('../../lib/oauth2.js');

//lib modules
var JSONEnvelope 	= require('../../lib/BE/JSONEnvelope.js');
var Log 			= require('../../lib/BE/Log.js');
var usersDAL 		= require('../../lib/DAL/usersDAL.js');
var LogDAL 			= require('../../lib/DAL/LogDAL.js');


/**
description: creates a new user, returns back the user
access level: valid client credentials
*/
router.post('/', function(req, res){

	var oUser = {
		name: req.body.name,
		email: req.body.email,
		password: req.body.password
	};
	
	var oEnvelope = new JSONEnvelope();
	
	//validation before saving
	req.assert('name', 'name is required').notEmpty();	//length check?
	req.assert('email', 'email is required').notEmpty();
	req.assert('email', 'valid email required').isEmail();
	req.assert('password', 'required').notEmpty();
	req.assert('password', '6 to 20 characters required').len(6, 20);
	var validationErrors = req.validationErrors();
	
	if(validationErrors){
	    oEnvelope.status.response_code = 409;
	    oEnvelope.status.message = validationErrors;
	    
		//logging and output
		var logObj = new Log(req, oEnvelope);
		logDAL.save(logObj, function(err, log){
			if(err){
				console.log(err);
			}else{
				oEnvelope.status.envelope_id = log._id;
			}
			res.json(oEnvelope);
		});
	}else{
		usersDAL.save(oUser, function(error, user){						
			if(error){			
	    		if (error.code === 11000 || error.code === 11001){
	    			oEnvelope.status.response_code = 409;
	    			oEnvelope.status.message = [{	"param": "email",
												    "msg": "email already exists",
												    "value": oUser.email
													} 
												];
	    		}else{
	    			oEnvelope.status.response_code = 500;
					oEnvelope.status.message = "Error adding user.";
				}	
				oEnvelope.status.errors = error.toString();
				oEnvelope.status.error_code = error.code;						
			}else{
				oEnvelope.response.data = {"user": user};
			}
			
			//logging and output
			var logObj = new Log(req, oEnvelope);
			logDAL.save(logObj, function(err, log){
				if(err){
					console.log(err);
				}else{
					oEnvelope.status.envelope_id = log._id;
				}
				res.json(oEnvelope);
			});
			
		});	
	}
	
});


/**
description: gets user by id
access level: bearer
*/
router.get('/:userID', passport.authenticate('bearer', {session: false}), function(req, res){

	usersDAL.findUserById(req.params.userID, function(error, user){				
		var oEnvelope = new JSONEnvelope();				
    	if(error){
			oEnvelope.status.response_code = 500;
			oEnvelope.status.message = "Error retrieving user.";
			oEnvelope.status.errors = error.toString();	
			oEnvelope.status.error_code = error.code;					
    	}else{
    		if(user == null){    			
    			oEnvelope.status.response_code = 404;
    			oEnvelope.status.message = "User not found.";    			
    		}else{ 
    			oEnvelope.response.data = {"user": user};    			
    		}	
    	}
    	
		//logging and output
		var logObj = new Log(req, oEnvelope);
		logDAL.save(logObj, function(err, log){
			if(err){
				console.log(err);
			}else{
				oEnvelope.status.envelope_id = log._id;
			}
			res.json(oEnvelope);
		});	    	
    	
    });
});


/**
description: update user's info
access level: bearer; :userID is same as req.query.user_id
*/
router.put('/:userID', function(req, res){
	
	//todo: validate user info
	
	var userObj = {
		_id: req.params.userID,
		name: req.body.name,
		email: req.body.email,
		password: req.body.password
	};
	var oEnvelope = new JSONEnvelope;
	
	usersDAL.update(userObj, function(error, user){		
		if(error){
			oEnvelope.status.response_code = 500;
			oEnvelope.status.message = "Error updating user.";
			oEnvelope.status.errors = error.toString();	
			oEnvelope.status.error_code = error.code;					
		}else{
			user.password = ""; //todo: repress hashed pw returned more elegantly?
			oEnvelope.response.data = {"user": user};
		}
		
		//logging and output
		var logObj = new Log(req, oEnvelope);
		logDAL.save(logObj, function(err, log){
			if(err){
				console.log(err);
			}else{
				oEnvelope.status.envelope_id = log._id;
			}
			res.json(oEnvelope);
		});		
		
	});
});


module.exports = router;