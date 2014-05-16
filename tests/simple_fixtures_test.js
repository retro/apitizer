define(['apitizer', 'jquery'], function(apitizer, $) {
	return function() {

		can.fixture.delay = 0;

		var userSchema = {
			type : "object",
			properties : {
				id : {
					type : 'integer'
				},
				username : {
					type : "string",
					minLength : 3,
					maxLength : 10
				},
				password : {
					type : "string",
					minLength : 6
				}
			}
		}

		var autoincrement = apitizer.types.autoincrement();

		apitizer.addSchema('user', userSchema);

		var store = apitizer.schemaStore('user', 10, {
			id : autoincrement
		});

		apitizer.fixture.resource('/users', store);


		module('apitizer/simple_fixtures');

		asyncTest("Getting all users", function(){
			expect(2);

			$.get('/users').then(function(users){
				equal(users.data.length, 10, "Correct number of users is returned");
				equal(users.count, 10, "Correct count is returned");
				start();
			});
		});

		asyncTest("Search for users", function(){
			expect(1);

			$.get('/users', {thisDoesNot : 'exist'}).then(function(users){
				equal(users.count, 0, "No users were returned");
				start();
			});
		});

		asyncTest("Create a user", function(){
			expect(3);

			var newUser = {username : "retro", password: "retroaktive"};

			$.post('/users', newUser).then(function(user){
				ok((user.username === 'retro' && user.password === 'retroaktive'), "User was created");
				$.get('/users').then(function(users){
					ok(users.count, 11, "User was added to the store");
					ok((users.data[10].username === 'retro' && users.data[10].password === 'retroaktive'), "User is last in the list");
					start();
				});
			})
		})

		asyncTest("Get a user", function(){
			expect(1);

			$.get('/users/11').then(function(user){
				ok((user.username === 'retro' && user.password === 'retroaktive'), "Correct user was retrieved");
				start();
			})
		})

		asyncTest("Find a user", function(){
			expect(2);

			$.get('/users', {username : "retro"}).then(function(users){
				equal(users.count, 1, "Only one user is found");
				equal(users.data[0].username, "retro", "Correct user is found");
				start();
			})
		})

		asyncTest("Update a user", function(){
			expect(2);

			$.ajax('/users/11', {
				data : {username : "foo"},
				type : 'put'
			}).then(function(updatedUser){
				equal(updatedUser.id, 11, "User is updated")
				$.get('/users/11').then(function(user){
					equal(updatedUser.id, 11, "Requesting updated user returns updated data");
					start();
				})
			})
		})

		asyncTest("Delete a user", function(){
			expect(1);
			$.ajax('/users/11', {
				type : 'delete'
			}).then(function(){
				$.get('/users').then(function(users){
					equal(users.count, 10, "User was destroyed");
					start();
				})
			})
		})

	};
});