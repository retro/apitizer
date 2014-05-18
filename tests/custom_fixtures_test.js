define(['apitizer', 'jquery'], function(apitizer, $) {
	return function() {
		
		module('apitizer/custom_fixtures', {
			teardown : function(){
				apitizer.dropSchemas();
			}
		});

		asyncTest("Login endpoint", function(){
			expect(2);

			var schema = {
					properties : {
						id : {
							type : 'integer'
						},
						username : {
							type : 'string'
						},
						password : {
							type : 'string'
						}
					}
				}, store;

			apitizer.addSchema('member', schema);

			store = apitizer.schemaStore('member', 0, {
				id : apitizer.types.autoincrement()
			});

			apitizer.fixture.resource('/members', store);

			store.add({
				username : 'retro',
				password : '1337'
			});

			apitizer.fixture('POST /login', function(params, data){
				var member = store.store(data).first();

				if(member){
					return member;
				} else {
					throw { error: 'Wrong login credentials.', status: 403 };
				}

			});

			$.post('/login', {
				username : 'retro',
				password : '1337'
			}).then(function(member){
				equal(member.username, 'retro', 'Member is logged in');
			});

			$.post('/login', {
				username : 'wrong',
				password : 'credentials'
			}).fail(function(error){
				equal(error.status, 403, "Correct status is returned from the login endpoint");
				start();
			})
		})

	};
});