define(['../_helpers', '../integer', '../string'], function(h, integer, string){

	var re = /^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/;

	return h.type(function(opts){
		
		var suffix = ['com', 'info', 'net', 'biz', 'edu', 'hr'],
			rand   = integer({
				maximum : suffix.length,
				exclusiveMaximum : true
			}).generate;

		return {
			generate : function(){
				return ['example', suffix[rand()]].join('.');
			},
			validate : function(val){
				return typeof val === "string" && re.test(val);
			}
		}
	})
})