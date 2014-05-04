define(['./_helpers'], function(h){
	return h.withDefaults({
		min: 0,
		max: 1
	}, function(opts){
		return {
			generate : function(){
				return Math.random() * (opts.max - opts.min + 1) + opts.min;
			},
			validate : function(val){
				return typeof val === 'number' && (val >= opts.min && val <= opts.max) && (val % 1 !== 0);
			}
		}
	})
})