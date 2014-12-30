define([
'lodash/collections/reduce',
'lodash/collections/contains',
'lodash/objects/assign',
'lodash/collections/forEach',
'lib/types/integer',
'rlite',
'fakexmlhttprequest',
'querystring'
], function(_reduce, _contains, _assign, _forEach, integer, Rlite, FakeXHR, queryString){

	var _delay = function(){
		return 200;
	}

	var _replaceParams = function(url){
		return url.replace(/\{([a-zA-Z0-9_-]*)\}/g, function(match, group){
			return ':' + group;
		});
	}

	var _prepareMethod = function(method){
		method = method || 'get';
		return '__' + method.toLowerCase() + '__';
	}

	var _cleanMultipleSlashes = function(url){
		return url.replace(/\/{2,}/g, '/');
	}

	var _cleanUrl = function(url){
		var urlArr = url.split(' ');

		if(urlArr.length === 1){
			urlArr.unshift(_prepareMethod());
		} else {
			urlArr[0] = _prepareMethod(urlArr[0]);
		}

		return _cleanMultipleSlashes(_replaceParams(urlArr.join('/'))).toLowerCase();
	};

	var _cleanParams = function(params){
		for(var k in params){
			if(params.hasOwnProperty(k) && typeof params[k] === 'string'){
				params[k] = decodeURIComponent(params[k]).replace(/[+]/g, ' ');
				if(params[k] === 'true'){
					params[k] = true;
				} else if(params[k] === 'false'){
					params[k] = false;
				}
			}
		}
		return params;
	}

	var r = new Rlite();

	var fakeXHROpen = FakeXHR.prototype.open;
	var currentResponder = null;

	var addResponder = function(url, fn){
		r.add(url, function(params){
			currentResponder = function(data){
				return fn(_cleanParams(params.params || {}), data);
			};
		});
	}

	var _handleRequest = function(xhr){
		var url = _cleanMultipleSlashes([_prepareMethod(xhr.method), xhr.url].join('/'));

		if(r.run(url)){
			(function(responder){
				setTimeout(function(){
					var data, res, status;
					if(xhr.requestHeaders['Content-Type'] && xhr.requestHeaders['Content-Type'].indexOf('json') > -1){
						data = JSON.parse(xhr.requestBody);
					} else {
						data = queryString.parse(xhr.requestBody);
					}
					try {
						res = responder(data);
						xhr.respond(200, {'Content-Type': 'application/json'}, JSON.stringify(res));
					} catch(e){
						status = e.status || 406;
						delete e.status;
						xhr.respond(status, {'Content-Type': 'application/json'}, JSON.stringify(e));
					}
				}, _delay());
			})(currentResponder);
		} else {
			// handle 404
		}
	}

	FakeXHR.prototype.open = function(){
		var res = fakeXHROpen.apply(this, arguments);
		_handleRequest(this);
		return res;
	}


	var fixturizer = function(url, fn){
		var cleanUrl = _cleanUrl(url);
		addResponder(cleanUrl, fn);
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
			_delay = function(){
				return Math.max(min, 1);
			}
		} else if(arguments.length === 2){
			_delay = integer({
				minimum : Math.max(min, 1),
				maximum : max
			}).generate;
		}
		return [min, max];
	}

	fixturizer.responder = FakeXHR;

	return fixturizer;
});