/**
 * oAuth2 implementation
 */
 
//Module dependencies
var oauth2orize 	= require('oauth2orize')
  , passport 		= require('passport')
  ,	AccessTokensDAL = require('./DAL/accessTokensDAL.js').AccessTokensDAL
  , ClientsDAL 		= require('./DAL/clientsDAL.js').ClientsDAL 
  ,	UsersDAL 		= require('./DAL/usersDAL.js').UsersDAL 
  , utils 			= require('./utils');

var accessTokensDAL = new AccessTokensDAL();
var clientsDAL = new ClientsDAL();
var usersDAL = new UsersDAL();

// create OAuth 2.0 server
var server = oauth2orize.createServer();

const expires_in = 3600 * 3;	//token expiration in seconds

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  clientsDAL.findByID(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  var code = utils.uid(16)
  
  authorizationCodes.save(code, client.id, redirectURI, user.id, function(err) {
    if (err) { return done(err); }
    done(null, code);
  });
}));


//grant_type=password; exchange username/password for access token
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done){
	usersDAL.authenticate(username, password, function(err, user){	
		if (err){ return done(err); }
		if (user == null){ return done(null, false); }
			
		var oAccessToken = {
			"user_id": user._id,
			"client_id": client
		};
		
		//if exists already, just return existing token for this user-client pair; if expired, flow should use refresh token
		accessTokensDAL.findUserClient(oAccessToken, function(err, eToken){
			if(err){ return done(err); }	
			if(eToken == null){
				var token = utils.uid(256);
				var refreshToken = utils.uid(256);		
				var token_timeout = new Date();
				token_timeout.setHours(token_timeout.getHours() + 3); //expire in 3 hours
				
				oAccessToken = {
					"token": token,
					"refresh_token": refreshToken,
					"user_id": user._id,
					"client_id": client,
					"token_timeout": token_timeout
				};
				
				//save new user-client access token 		
				accessTokensDAL.save(oAccessToken, function(err){
					if (err) { return done(err); }
		     		done(null, token, refreshToken, {"expires_in":expires_in});
				});
				
			}else{
				var expires = utils.datediff('s', new Date(), eToken.token_timeout);
				return done(null, eToken.token, eToken.refresh_token, {"expires_in":expires});
			}
		});
	});
}));

//grant_type=refresh_token; exchange refresh token for new access token; pass user_id in as scope
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done){
	var oToken = {
		"refresh_token": refreshToken,
		"client_id": client,
		"user_id": scope
	};
	accessTokensDAL.findToken(oToken, function(err, token){
		if (err){ return done(err); }
		if (token == null){ return done(null, false); }
		
		var accesstoken = utils.uid(256);
		var newRefreshToken = utils.uid(256);		
		var token_timeout = new Date();
		token_timeout.setHours(token_timeout.getHours() + 3); //expire in 3 hours
		
		var oAccessToken = {
			"_id": token._id,
			"token": accesstoken,
			"refresh_token": newRefreshToken,
			"token_timeout": token_timeout
		};
		
		//update existing user tokens
		accessTokensDAL.updateTokens(oAccessToken, function(err){
			if (err) { return done(err); }
     		done(null, accesstoken, newRefreshToken, {"expires_in":expires_in, "token_timeout":token_timeout});
		});	
	});
}));


// user authorization endpoint
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request.  In
// doing so, is recommended that the `redirectURI` be checked against a
// registered value, although security requirements may vary accross
// implementations.  Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectURI` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization).  We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view. 

exports.authorization = [
  server.authorization(function(clientID, redirectURI, done) {
    clientsDAL.findByID(clientID, function(err, client) {
      if (err) { return done(err); }
      // WARNING: For security purposes, it is highly advisable to check that
      //          redirectURI provided by the client matches one registered with
      //          the server.  For simplicity, this example does not.  You have
      //          been warned.
      return done(null, client, redirectURI);
    });
  }),
  function(req, res){
    res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
  }
]

// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

exports.decision = [
  server.decision()
]


// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.

exports.token = [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
]