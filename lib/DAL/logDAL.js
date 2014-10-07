/**
logging schema for API calls
*/
var mongoose = require('mongoose');
var DBConnection = require('./dbConnection.js').DBConnection();
var Schema = mongoose.Schema;

var logSchema = new Schema({
	uri: {type: String, required: true},
	status: { 
			response_code: Number, 
			message: String,
			errors: String,
			error_code: Number
	},
	create_date: {type: Date, default:Date.now, required: true}
});

var logs = DBConnection.model('logs', logSchema);
var LogDAL = function(){};

/**
saves document to logs collection
*/
LogDAL.prototype.save = function(pLog, pCallback){
	var logObj = new logs(pLog);
	logObj.save(function(err, log){
		pCallback(err, log);
	});
};

/**
updates document
*/
LogDAL.prototype.update = function(pLog, pCallback){
	logs.findById(pLog._id, function(err, log){
		if(err){ return pCallback(err, null); }
		if(log == null){
			return pCallback("log not found.", null);
		}
		log.status.response_code = pLog.status.response.code;
		log.status.message = pLog.status.message;
		log.status.errors = pLog.status.errors;
		log.status.error_code = pLog.status.error_code;
		log.save(function(error){
			pCallback(error, log);
		});
		
	});
};

exports.LogDAL = LogDAL;