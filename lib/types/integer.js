define(['./_helpers'], function(h){
	return h.type({
		minimum: 0,
		maximum: 1,
		multipleOf : null,
		exclusiveMaximum : false,
		exclusiveMinimum : false
	}, function(opts){
		var min = parseInt(opts.exclusiveMinimum ? opts.minimum + 1 : opts.minimum, 10),
			max = parseInt(opts.exclusiveMaximum ? opts.maximum - 1 : opts.maximum, 10);

		if(max < min){
			throw new Error("Apitizer/Integer type: Minimum can't be bigger than maximum. Passed options: " + JSON.stringify(opts));
		}

		return {
			generate : function(){
				var val = Math.floor(Math.random() * (max - min + 1)) + min;
				return opts.multipleOf ? val - (val % opts.multipleOf) : val;
			},
			validate : function(val){
				var check = (typeof val === 'number') && (val >= min && val <= max);
				return check && (val % opts.multipleOf === 0);
			}
		}
	})
})