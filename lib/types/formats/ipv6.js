define(['../_helpers', '../integer'], function(h, integer){

	var re = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;

	return h.type(function(opts){
		var g = function(){
			return Math.floor(Math.random()*65535).toString(16);
		};

		return {
			generate : function(){
				return [g(), g(), g(), g(), g(), g(), g(), g()].join(':').toUpperCase();
			},
			validate : function(val){
				return typeof val === "string" && re.test(val);
			}
		}
	})
})