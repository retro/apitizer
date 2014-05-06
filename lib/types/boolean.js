define(['./_helpers', './integer'], function(h, integer){
	return h.type(function(){
		return {
			generate : function(){
				return integer({minimum: 0, maximum: 10}).generate() % 2 === 0;
			},
			validate : function(val){
				return typeof val === 'boolean';
			}
		}
	})
})