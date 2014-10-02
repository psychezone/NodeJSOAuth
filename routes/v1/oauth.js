var express = require('express');
var router = express.Router();

//oauth modules
var passport	= require('passport'),
	oauth2 		= require('../../lib/oauth2.js');

/**
description: login - oauth access token retrieval with credentials
access level: valid client credentials
*/
router.post('/login', oauth2.token);


/**
description: logout - oauth logout;
access level: bearer; revokes access token that belongs to req.query.user_id
*/
router.get('/logout', passport.authenticate('bearer', {session: false}), function(req, res){

	var oToken = {
		"_id": req.authInfo.token_id	//req.authInfo is returned from passport bearer strategy		
	};
	
	accessTokensDAL.revoke(oToken, function(err, token){
		var oEnvelope = new JSONEnvelope();
		if(err){
			oEnvelope.status.response_code = 500;
			oEnvelope.status.message = "Error logging out.";
			oEnvelope.status.errors = error.toString();
			oEnvelope.status.error_code = error.code;  
		}else if(token == null){
		    oEnvelope.status.response_code = 404;
    		oEnvelope.status.message = "No valid session to logout."; 
		}else{
			oEnvelope.status.message = "Successfully logged out.";
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
