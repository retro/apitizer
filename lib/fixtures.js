define([
'fixture',
'lodash/collections/reduce',
'lodash/collections/contains',
'lodash/objects/assign',
'lodash/collections/forEach',
'lib/types/integer',
], function(fixture, _reduce, _contains, _assign, _forEach, integer){

	var delay = function(){
		return 200;
	}

	var setDelay = function(){
		fixture.delay = delay();
	}

	var cleanUrl = function(url){
		return url.split(' ').pop();
	};

	var fixturizer = function(url, fn){
		var matchingUrl = cleanUrl(url);

		fixture(url, function(request, respondWith, headers, xhr){

			setDelay();
			
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

	fixturizer.resource = function(baseUrl, store){
		_forEach(endpoints, function(template, action){
			fixturizer(template.replace(re, baseUrl), store.API[action]);
		})
	}

	fixturizer.delay = function(min, max){
		if(arguments.length === 1){
			delay = function(){
				return min;
			}
		} else if(arguments.length === 2){
			delay = integer({
				minimum : min,
				maximum : max
			}).generate;
		}
		return [min, max];
	}

	return fixturizer;
});