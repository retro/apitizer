define(['faker', './_helpers'], function(faker, h){
	return h.type({
		generator : function(){ return faker.Lorem.paragraph() },
		maxLength : Infinity,
		minLength : 0
	}, function(opts){
		return {
			generate : function(){
				var val = "",
					lastIndexOf;

				do {
					val += opts.generator() + ' ';
				} while(val.length < opts.minLength);

				val = val.replace(/^\s+|\s+$/g,'');

				if(opts.maxLength < Infinity){
					lastIndexOf = Math.max(val.lastIndexOf(' ', opts.maxLength), opts.minLength);
					val = val.substr(0, lastIndexOf || opts.maxLength);
				}

				return val;
				
			},
			validate : function(val){
				var check = typeof val === 'string';

				return check && check.length >= opts.minLength && check.length <= opts.maxLength;
			}
		}
	})
})