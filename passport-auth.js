/**
 * Module dependencies.
 */
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , BasicStrategy = require('passport-http').BasicStrategy
  , ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
  , BearerStrategy = require('passport-http-bearer').Strategy
  ,	UsersDAL = require('./lib/DAL/usersDAL.js').UsersDAL
  , ClientsDAL = require('./lib/DAL/clientsDAL.js').ClientsDAL
  ,	AccessTokensDAL = require('./lib/DAL/accessTokensDAL.js').AccessTokensDAL

var clientsDAL = new ClientsDAL();
var usersDAL = new UsersDAL();
var accessTokensDAL = new AccessTokensDAL();

/**
 * LocalStrategy - NOT used
 *
 * This strategy is used to authenticate users based on a username and password.
 * Any time a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(new LocalStrategy(
  function(username, password, done) {
    users.findByUsername(username, function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (user.password != password) { return done(null, false); }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  users.find(id, function (err, user) {
    done(err, user);
  });
});


/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use(new BasicStrategy(
  function(username, password, done) {
    clientsDAL.findByID(username, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.client_secret != password) { return done(null, false); }
      return done(null, client);
    });
  }
));

passport.use(new ClientPasswordStrategy(
  function(clientID, clientSecret, done) {
    clientsDAL.findByID(clientID, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.client_secret != clientSecret) { return done(null, false); }
      return done(null, client);
    });
  }
));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate users based on an access token (aka a
 * bearer token).  The user must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy({ "passReqToCallback": true },
  function(req, accessToken, done) {
	var oToken = {
		"token": accessToken,
		"client_id": req.query.client_id,
		"user_id": req.query.user_id
	};
    accessTokensDAL.findToken(oToken, function(err, token) {
		if (err) { return done(err); }
		if (!token) { return done(null, false); }
		var info = { 
			"scope": req.query.user_id,
			"token_id": token._id
		};
        done(null, token, info); 
    });
  }
));

