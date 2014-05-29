define(['../_helpers', '../integer', '../string', './hostname'], function(h, integer, string, hostname){

	var re = /(https?|ftp):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?/;

	return h.type(function(opts){
		
		var seed = integer({
				maximum : 1000
			}).generate,
			rand = integer({
				maximum : 3,
				exclusiveMaximum : true
			}).generate,
			chance = function(){
				return seed() % rand() === 0;
			},
			hostnameGen = hostname().generate,
			strings = string().generate().split(' '),
			randString = integer({
				maximum : strings.length,
				exclusiveMaximum : true
			}).generate,
			schemes = ["http", "https", "ftp"],
			exts = ['html', 'php', 'aspx'],
			cleanString = function(str){
				return str.replace(/[^a-zA-Z-_0-9]/g, '');
			}

		return {
			generate : function(){
				var scheme = schemes[rand()] + "://",
					host   = hostnameGen(),
					path   = "",
					filename = ""
					query = "",
					fragment = "";

				if(chance()){
					path = "/" + cleanString(strings[randString()]);
				}

				if(chance()){
					filename = "/" + cleanString(strings[randString()]) + '.' + exts[rand()];
				}

				if(chance()){
					query = "?" + cleanString(strings[randString()]);
				}

				if(chance()){
					fragment = "#" + cleanString(strings[randString()]);
				}

				return scheme + host + path + filename + query + fragment;

			},
			validate : function(val){
				return typeof val === "string" && re.test(val);
			}
		}
	})
})