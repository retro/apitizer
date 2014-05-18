define(['./_helpers'], function(h){
	return h.type(function(opts){

		var current = 1;

		return {
			generate : function(){
				return current++;
			},
			validate : function(val){
				return val <= current;
			}
		}
	})
})