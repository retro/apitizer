define(['faker', './_helpers'], function(faker, h){
	return h.type({
		type : 'sentence', // can be any of: words, sentence, sentences, paragraph, paragraphs
		isEmptyStringValid : true
	}, function(opts){
		return {
			generate : function(){
				return faker.Lorem[opts.type]();
			},
			validate : function(val){
				var check = typeof val === 'string';

				if(check && !opts.isEmptyStringValid){
					check = check && val.length > 0;
				}

				return check;
			}
		}
	})
})