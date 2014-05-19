define(['./_helpers', './integer', 'lodash/collections/reduce'], function(h, integer, _reduce){
	return h.type({
		oneOf : []
	},function(opts){
		return {
			generate : function(){
				console.log(opts.anyOf)
				return opts.anyOf[integer({minimum: 0, maximum: opts.anyOf.length - 1}).generate()].generate();
			},
			validate : function(val){
				return _reduce(opts.anyOf, function(res, type){
					return type.validate(val) || res;
				}, false);
			}
		}
	})
})