/**
API Access Tokens
*/
var mongoose = require('mongoose');
var DBConnection = require('./dbConnection.js').DBConnection();
var Schema = mongoose.Schema;

var accessTokensSchema = new Schema({
	token: {type: String, required: true},
	token_timeout: {type: Date},
	refresh_token: String,	
	user_id: { type:Schema.Types.ObjectId, ref:'users' },
	client_id: { type:Schema.Types.ObjectId, ref:'clients' },
	create_date: {type: Date, default: Date.now, required: true},
	modified_date: {type: Date, default: Date.now, required: true},
	is_revoked: {type: Boolean, default: false, required: true}
});

accessTokensSchema.index({token:1, user_id:1, client_id:1, is_revoked:1, token_timeout:-1});
accessTokensSchema.index({refresh_token:1, user_id:1, client_id:1, is_revoked:1});
accessTokensSchema.index({user_id:1, client_id:1, is_revoked:1});

/**
middleware: update modified date before save
*/
accessTokensSchema.pre('save', function(next, done){
    this.modified_date = new Date();
    next();
});

var accessTokens = DBConnection.model('accessTokens', accessTokensSchema);
var AccessTokensDAL = function(){};


/**
saves document to accessTokens collection
*/
AccessTokensDAL.prototype.save = function(pAccessToken, pCallback){
	var accessTokenObj = new accessTokens(pAccessToken);
	accessTokenObj.save(function(err, accessToken){
		pCallback(err, accessToken);
	});
};

/**
updates accesstoken document's tokens and timeout
*/
AccessTokensDAL.prototype.updateTokens = function(pAccessToken, pCallback){
	accessTokens.findById(pAccessToken._id, function(err, accesstoken){
		if(err){
			pCallback(err, null);
		}else{
			if(accesstoken == null){
				pCallback("invalid token", null);
			}else{
				accesstoken.token = pAccessToken.token;
				accesstoken.refresh_token = pAccessToken.refresh_token;
				accesstoken.token_timeout = pAccessToken.token_timeout;
				accesstoken.save(function(error){
					pCallback(error, accesstoken);
				});
			}
		}
	});
};

/**
revokes accesstoken 
*/
AccessTokensDAL.prototype.revoke = function(pAccessToken, pCallback){
	accessTokens.findById(pAccessToken._id, function(err, accesstoken){
		if(err){
			pCallback(err, null);
		}else{
			if(accesstoken == null){
				pCallback("invalid token", null);
			}else{
				accesstoken.is_revoked = true;
				accesstoken.save(function(error){
					pCallback(error, accesstoken);
				});
			}
		}
	});
};


/**
finds if valid token given access or refresh token with client_id, and user_id
*/
AccessTokensDAL.prototype.findToken = function(pAccessToken, pCallback){
	var query = accessTokens.findOne();
	if(pAccessToken.refresh_token != "" && pAccessToken.refresh_token != null){
		query.where('refresh_token').equals(pAccessToken.refresh_token);		
	}else{
		var currentTime = new Date();
		query.where('token').equals(pAccessToken.token);
		query.where('token_timeout').gte(currentTime);
	}
	query.where('user_id').equals(pAccessToken.user_id);
	query.where('client_id').equals(pAccessToken.client_id);
	query.where('is_revoked').equals(false);		
	query.select('_id');
	query.exec(function(err, token){
		pCallback(err, token);
	});
};

/**
find if user-client pair already exists
*/
AccessTokensDAL.prototype.findUserClient = function(pAccessToken, pCallback){
	var query = accessTokens.findOne();
	query.where('user_id').equals(pAccessToken.user_id);
	query.where('client_id').equals(pAccessToken.client_id);
	query.where('is_revoked').equals(false);
	query.select('token refresh_token token_timeout');
	query.exec(function(err, token){
		pCallback(err, token);
	});

};


exports.AccessTokensDAL = AccessTokensDAL;