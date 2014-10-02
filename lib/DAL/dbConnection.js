var mongoose = require('mongoose');

DBConnection = function(pHost, pDatabase, pPort){
	if (pHost=="undefined" || pHost ==undefined){
		pHost = 'localhost';
	}
	if (pDatabase=="undefined" || pDatabase == undefined){
		pDatabase = "node-mongo-test";
	}
	if (pPort=="undefined" || pPort ==undefined){
		pPort = 27017;
	}
	db = mongoose.createConnection();
	db.open(pHost, pDatabase, pPort);
	db.on('error', console.error.bind(console, 'connection error:'));
	return db;
}

exports.DBConnection = DBConnection;