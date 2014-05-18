define(['can/util/fixture', 'lodash'], function(fixture, _){

	var cleanUrl = function(url){
		return url.split(' ').pop();
	};

	var prepareParams = function(params){
		return _.reduce(params || {}, function(acc, val, key){
			acc[key] = {'==' : val};
			return acc;
		}, {})
	}

	var fixturizer = function(url, fn){
		var matchingUrl = cleanUrl(url);

		can.fixture(url, function(request, respondWith, headers, xhr){
			
			var params = fixture._getData(matchingUrl, request.url || xhr.url) || {},
				data = request.data || {},
				response, status;


			if(request.type.toLowerCase() === "get"){
				_.extend(params, request.data || {});
			}

			params = prepareParams(params);

			_.each(params, function(val, key){
				delete data[key];
			})

			try {
				response = fn.length === 1 ? fn(params) : fn(params, data);
				return response;
			} catch(e) {
				if(e === "MissingRecord"){
					respondWith(404, JSON.stringify('{"error" : "Missing record"}'));
				} else {
					status = e.status || 406;
					delete e.status;
					respondWith(status, JSON.stringify(e));
				}
			}
		})
	};

	var endpoints = {
		findOne : "GET <%= url %>/{id}",
		findAll : "GET <%= url %>",
		create  : "POST <%= url %>",
		update  : "PUT <%= url %>/{id}",
		destroy : "DELETE <%= url %>/{id}",
	}

	fixturizer.resource = function(url, store){
		_.each(endpoints, function(template, action){
			fixturizer(_.template(template, {url : url}), store[action]);
		})
	}

	return fixturizer;
});