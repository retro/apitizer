define(function(){
	var ApitizerError = function (message){
		this.message = message;
		this.stack = (new Error()).stack;
	}
	ApitizerError.prototype = new Error;
	ApitizerError.prototype.name = 'ApitizerError'; 

	return ApitizerError;
})