NodeJSOAuth
===========
OAuth2 implementation of user authentication in Node.js using Passport Bearer/Local strategy

## Introduction
Example of running OAuth2 server on Node.js to authenticate users for use on a mobile app. 

##URL convention
To easily allow versioning and deprecating of older versions of the API, I'm pre-pending the endpoints with /v1/ so that in the future, we can add /v2, /v3, etc.
api.domain.com/v1/resource/element?param1=val1&param2=val2

##Format:
By default, JSON is returned

##API endpoints
POST 		/users - add new user 

GET			/users/:userID - get user’s current info 

PUT 		/users/:userID - update user’s info 
	
POST		/oauth/login - authenticate login and gets back tokens (grant_type=password) OR gets new tokens with refresh token (grant_type=refresh_token) 

GET 		/oauth/logout - logout user 


## Getting Started
1. Just run npm install on project and start up application with 'sudo npm start'
2. Send curl request to endpoints, examples coming up...

