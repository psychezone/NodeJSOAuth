/**
API clients
*/
var mongoose = require('mongoose');
var DBConnection = require('./dbConnection.js').DBConnection();
var Schema = mongoose.Schema;

var clientsSchema = new Schema({
	name: {type: String, required: true},
	client_secret: {type: String, required: true},
	create_date: {type: Date, default: Date.now, required: true, select: false}
});

var clients = DBConnection.model('clients', clientsSchema);
var ClientsDAL = function(){};

/**
find client by _id
*/
ClientsDAL.prototype.findByID = function(pID, pCallback){
	clients.findById(pID, function(err, client){
		pCallback(err, client);
	});
}


/*
populate a client:
db.clients.insert({name:"ios_appv1", client_secret: "secret"});
*/

exports.ClientsDAL = ClientsDAL;