define(['RandExp', './_helpers'], function(RandExp, h){
	return h.type({
		pattern: null
	}, function(opts){
		return {
			generate : function(){
				return opts.pattern && new RandExp(opts.pattern).gen();
			},
			validate : function(val){
				return opts.pattern && opts.pattern.test(val);
			}
		}
	})
})