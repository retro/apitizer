define(['./_helpers', './integer'], function(h, integer){
	return h.type(function(){
		return {
			generate : function(){
				return integer({min: 0, max: 10}).generate() % 2 === 0;
			},
			validate : function(val){
				return typeof val === 'boolean';
			}
		}
	})
})