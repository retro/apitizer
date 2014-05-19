define([
'can/util/fixture',
'lodash/collections/reduce',
'lodash/collections/contains',
'lodash/objects/assign',
'lodash/collections/forEach',
], function(fixture, _reduce, _contains, _assign, _forEach){

	var cleanUrl = function(url){
		return url.split(' ').pop();
	};

	var fixturizer = function(url, fn){
		var matchingUrl = cleanUrl(url);

		can.fixture(url, function(request, respondWith, headers, xhr){
			
			var params = fixture._getData(matchingUrl, request.url || xhr.url) || {},
				data = request.data || {},
				response, status;


			if(request.type.toLowerCase() === "get"){
				_assign(params, request.data || {});
			}

			_forEach(params, function(val, key){
				delete data[key];
			});

			try {
				response = fn.length === 1 ? fn(params) : fn(params, data);
				return response;
			} catch(e) {
				status = e.status || 406;
				delete e.status;
				respondWith(status, JSON.stringify(e));
			}
		})
	};

	var endpoints = {
		findOne : "GET %url%/{id}",
		findAll : "GET %url%",
		create  : "POST %url%",
		update  : "PUT %url%/{id}",
		destroy : "DELETE %url%/{id}",
	};

	var re = /%url%/;

	fixturizer.resource = function(url, store){
		_forEach(endpoints, function(template, action){
			fixturizer(template.replace(re, url), store.API[action]);
		})
	}

	return fixturizer;
});