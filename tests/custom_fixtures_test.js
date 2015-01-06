define(['apitizer', 'jquery'], function(apitizer, $) {
	return function() {
		
		module('apitizer/custom_fixtures', {
			setup: function(){
				apitizer.start();
			},
			teardown : function(){
				apitizer.dropSchemas();
				apitizer.stop();
			}
		});

		asyncTest("Login endpoint", function(){
			expect(3);

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
				}, store, obj;

			apitizer.addSchema('member', schema);

			store = apitizer.schemaStore('member', 0, {
				id : apitizer.types.autoincrement()
			});

			apitizer.fixture.resource('/members', store);

			obj = store.add({
				username : 'retro',
				password : '1337'
			});

			equal(obj.id, 1, "Member has id assigned");

			apitizer.fixture('POST /login', function(params, data){
				var member = store.db(data).first();

				if(member){
					return member;
				} else {
					throw new apitizer.Error({ errors: ['Wrong login credentials.'], status: 403 });
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
			});
			
		})

	};
});