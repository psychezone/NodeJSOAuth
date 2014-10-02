/**
Log for API response
*/
var Log = function(pRequest, pEnvelope){

	if (!this instanceof Log){
		return new Log(pRequest, pEnvelope);
	}    
	this.uri = pRequest.url;
	this.status = {
		"response_code": pEnvelope.status.response_code,
		"message": pEnvelope.status.message,
		"errors": pEnvelope.status.errors,
		"error_code" : pEnvelope.status.error_code
	};

	return this;
}

exports.Log = Log;
