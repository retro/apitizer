define(['./_helpers'], function(h){

	var LIPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas feugiat pretium dictum. Praesent non erat nunc. Sed fringilla sollicitudin blandit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam quam nulla, pretium in laoreet aliquet, lobortis vel dolor. Nullam vehicula ut sapien eget feugiat. Fusce vel imperdiet lacus. Ut eu vestibulum dui, et bibendum dui. Nam adipiscing nisi nec volutpat rutrum. Donec non quam dolor. In hac habitasse platea dictumst. Praesent scelerisque aliquam metus vel vehicula. Cras malesuada quam tincidunt libero aliquam, ut feugiat felis lacinia.";

	return h.type({
		generator : function(){ return LIPSUM },
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