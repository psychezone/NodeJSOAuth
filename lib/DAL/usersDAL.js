/**
users schema
*/
var mongoose = require('mongoose');
var DBConnection = require('./dbConnection.js').DBConnection();
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

//consts
const BCRYPT_ROUNDS = 10;

var usersSchema = new Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	password: { type: String, required: true, select: false },
	create_date: { type: Date, default:Date.now, required: true, select: false }
});

usersSchema.path('email').index({ unique: true });

/**
middleware: hash password before saving user document
*/
usersSchema.pre('save', function(next){
	var userObj = this;
	
	//only hash password if it's been modified or is new
	if(!userObj.isModified('password')){
		return next();
	}
	
	//generate salt
	bcrypt.genSalt(BCRYPT_ROUNDS, function(err, salt){
		if(err){
			return next(err);
		}
		//hash the password with salt
		bcrypt.hash(userObj.password, salt, function(err, hash){
			if(err){
				return next(err);
			}
			
			//override cleartext passwith with hash
			userObj.password = hash;
			next();
		});
		
	});
	
});

/**
tests if password matches the user's password
*/
usersSchema.methods.comparePassword = function(pTestPassword, pCallback){
	bcrypt.compare(pTestPassword, this.password, function(err, isMatch){
		pCallback(err, isMatch);
	});
};

var users = DBConnection.model('users', usersSchema);

var UsersDAL = function(){};

/**
saves document to users collection
*/
UsersDAL.prototype.save = function(pUser, pCallback){
	var userObj = new users(pUser);
	userObj.save(function(err, user){
		pCallback(err, user);
	});
};

/**
updates user document
*/
UsersDAL.prototype.update = function(pUser, pCallback){
	users.findById(pUser._id, function(err, user){
		if(err){
			pCallback(err, null);
		}else{
			if(user == null){
				pCallback("user doesn't exist.", null);
			}else{
				user.name = pUser.name;
				user.email = pUser.email;
				user.password = pUser.password;
				user.save(function(error){
					pCallback(error, user);
				});
			}	
		}
	});
};

/**
authenticates if valid user with email and password
*/
UsersDAL.prototype.authenticate = function(pEmail, pPassword, pCallback){
	var query = users.findOne();
	query.where('email').equals(pEmail);
	query.select('_id password');
	query.exec(function(err, user){
		if(err){
			return pCallback(err, null);
		}
		if(user == null){
			return pCallback(null, false);
		}
		var userObj = new users(user);
		userObj.comparePassword(pPassword, function(err, isMatch){
			if(err){ return pCallback(err, null); } 
			if(isMatch){	
				pCallback(null, user);
			}else{
				pCallback(err, null);
			}	
		});
	});
};


/**
returns user by id
*/
UsersDAL.prototype.findUserById = function(pUserID, pCallback){
	users.findById(pUserID, function(err, user){
		pCallback(err, user);
	});
};

exports.UsersDAL = UsersDAL;