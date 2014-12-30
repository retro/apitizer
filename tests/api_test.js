define(['apitizer', 'lodash'], function(apitizer, _) {
	return function() {

		module('apitizer/api', {
			setup : function(){
				apitizer.start();
			},
			teardown : function(){
				apitizer.dropSchemas();
				apitizer.stop();
			}
		});

		asyncTest('Extend API', function() {
			expect(2);

			var api = apitizer.API.extend({
					findAll : function(params){

						params = this._prepareParams(params);

						var results = {},
							limit = params.limit,
							offset = params.offset,
							items;

						delete params.limit;
						delete params.offset;

						items = this._getRecordset(params);
						
						results.count = items.count();

						if(limit){
							results.limit = limit;
							items = items.limit(parseInt(limit, 10));
						}

						if(offset){
							results.offset = offset;
							items = items.start(offset);
						}

						results.data = items.get();

						ok(true, "Custom findAll called");

						return results;
					}
				}),
				schema = {
					type : "object",
					properties : {
						username : {
							type : "string"
						}
					}
				},
				store;

			apitizer.addSchema('user', schema);
			store = apitizer.schemaStore('user', 10, {}, api);
			apitizer.fixture.resource('/users', store);

			$.get('/users').then(function(users){
				equal(users.data.length, 10, "Users are returned");
				start();
			});
		})

	};
});