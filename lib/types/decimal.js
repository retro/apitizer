define(['./_helpers'], function(h){
	return h.type({
		minimum: 0,
		maximum: 1,
		multipleOf : null,
		exclusiveMaximum : false,
		exclusiveMinimum : false
	}, function(opts){
		var min = opts.exclusiveMinimum ? opts.minimum + 0.1 : opts.minimum,
			max = opts.exclusiveMaximum ? opts.maximum - 0.1 : opts.maximum;

		return {
			generate : function(){
				var val = Math.random() * (max - min) + min;
				return opts.multipleOf ? val - (val % opts.multipleOf) : val;
			},
			validate : function(val){
				var check = (typeof val === 'number') && (val >= min && val <= max);
				return check && (val % opts.multipleOf === 0);
			}
		}
	})
})