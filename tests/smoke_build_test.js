module("apitizer/smoke");

asyncTest("Make sure stuff works", function(){
	expect(5);
	var schema = {
		type : "object",
		properties : {
			id : {
				type : "integer"
			},
			username : {
				type : "string"
			},
			password : {
				type : "string"
			}
		}
	}
	apitizer.addSchema('user', schema);
	apitizer.fixture.resource('/users', apitizer.schemaStore('user', 10));

	$.get('/users').then(function(){
		ok(true);
	});

	$.get('/users/1').then(function(){
		ok(true);
	});

	$.post('/users').then(function(){
		ok(true);
	});

	$.ajax('/users/1', {
		data : {},
		type : 'put'
	}).then(function(){
		ok(true);
	});

	$.ajax('/users/1', {
		data : {},
		type : 'delete'
	}).then(function(){
		ok(true);
		start();
	});

});