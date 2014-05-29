define(['../_helpers', '../integer'], function(h, integer){

	var re = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

	return h.type(function(opts){
		var g = integer({
			minimum : 1,
			maximum : 255
		}).generate;

		return {
			generate : function(){
				return [g(), g(), g(), g()].join('.');
			},
			validate : function(val){
				return typeof val === "string" && re.test(val);
			}
		}
	})
})