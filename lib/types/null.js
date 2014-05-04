define(['./_helpers'], function(h){
	return h.type(function(){
		return {
			generate : function(){
				return null;
			},
			validate : function(val){
				return val === null;
			}
		}
	})
})