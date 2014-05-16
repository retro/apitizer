define(['can/util/fixture'], function(fixture){
	var fixturizer = function(url, fn){
		can.fixture(url, function(request, respondWith){
			
			var params = fixture._getData(url, request.url),
				response;

			try {
				response = fn.length === 1 ? fn(params) : fn(params, request.data);
				return response;
			} catch(e) {
				if(e === "MissingRecord"){
					respondWith(404, JSON.stringify({error : "Missing Record"}));
				} else {
					respondWith(406, JSON.stringify(e));
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