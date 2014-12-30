# APItizer

APItizer is a library that allows you to mock APIs for browser applications with JSON schema. JSON schema is usually used to validate responses from APIs, but APItizer adds the ability to generate data from the same structure.

APItizer requires understanding of the JSON schema syntax and I can recommend [this guide](http://spacetelescope.github.io/understanding-json-schema/) to get you started.

## Updating from v0.0.4

**You must call `apitizer.start()` now for APItizer to work.** 

Prior to the version `0.1.0` APItizer was using the [can.fixture](http://canjs.com/docs/can.fixture.html) library to mock the XHR requests, but it was replaced with the [FakeXMLHttpRequest](https://github.com/trek/FakeXMLHttpRequest) library. FakeXMLHttpRequest library replaces the browser XHR object which enables APItizer to work without any library dependencies (jQuery or Zepto).

This change requires you to manually start the APItizer from your code with the following command:

	apitizer.start();

This will replace the `window.XMLHttpRequest` object and allow APItizer to take over. Stopping APItizer is done with the following command:

	apitizer.stop();

## Why

When developing single page apps, it is beneficial to develop the frontend and the backend in the parallel. To achieve that, you need to mock the API. APItizer allows you to mock your API by defining the JSON schema which is used to generate the fake data.

By using the JSON schema to define the format of the API responses, you create an explict contract which can be used to validate backend responeses once you start to integrate the real API.

## Installation

Install it with bower:
    
    bower install apitizer

APItizer can used included either as a script tag:

	<script type="text/javascript" src="path/to/apitizer.js"></script>

Or loaded with the Require.js (or any other AMD loader):

	define(["path/to/apitizer"], function(apitizer){ })

After the APItizer is loaded you have to start it before it can intercept the requests:
	
	define(["path/to/apitizer"], function(apitizer){ 
		apitizer.start();
	})


## Example

Let's implement a simple user endpoint. It will reside on the `/users` endpoint and implement all the usual `REST` operations.

First let's define the schema:

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

Now we can add it to the APItizer:

	apitizer.addSchema('user', schema);

After adding it to the `apitizer` we can mock the API:

	apitizer.fixture.resource('/users', apitizer.schemaStore('user', 10));

This will create a store with 10 users in it and add all REST API endpoints:

	GET /users
	GET /users/{id}
	POST /users
	PUT /users/{id}
	DELETE /users/{id}

Now you can normally use AJAX functions and they will hit the mocked API:

	$.get('/users') // Response will return 10 users
	$.get('/users/1') // Response will return the user with the id 1
	$.post('/users', {username : 'foo', password : 'bar'}) // User will be created and saved to the store
	$.ajax('/users/1', {type : 'put', data : {username : 'baz'}}) // User with the id 1 will be updated
	$.ajax('/users/1', {type : 'delete'}) // User with the id 1 will be destroyed and removed from the store

## Overriding generators

APItizer implements it's own generators for all types supported by the JSON schema, but sometimes you want more control over the data that is being generated. To achieve this, you can pass overrides to the store:

	var store = apitizer.schemaStore('user', 10, {
		id : apitizer.types.autoincrement(),
		username : function(){
			var count = 1;
			return function(){
				return "User " + (count++);
			}
		}
	});

This store will now contain objects that look like this:

	[{
		id: 1,
		username : "User 1",
		password : ...
	},
	{
		id: 2,
		username : "User 2",
		password : ...
	}]

Using overrides will allow you to take control over parts of your data that are important to you. Another use for the overrides is embedding an object from one store to the object generated from another store. 

Let's say you want to mock a simple publishing API, where you have two types of resources:

1. Articles
2. Authors

Each article contains the author object. You can easilly write a schema for this:

	var authorSchema = {
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

	var articleSchema = {
		type : "object",
		properties : {
			title : {
				type : "string"
			},
			body : {
				type : "string"
			},
			author : {
				$ref : "author"
			}
		}
	}

	apitizer.addSchema('author', authorSchema);
	apitizer.addSchema('article', articleSchema);

_This example introduces another concept, referenced schemas which are denoted by the `$ref` key. For now, it is enough to know that this will get the `author` schema from the repository and use it to generate the data._

If we create `author` and `article` stores without overrides:

	var authorStore = apitizer.schemaStore('author', 10);
	var articleStore = apitizer.schemaStore('article', 10);

Each article will contain generated `author` object, but that author object will not look like anything contained in the `authorStore`. We can fix that by using overrides:

	var authorStore = apitizer.schemaStore('author', 10);
	var articleStore = apitizer.schemaStore('article', 10, {
		author : authorStore.one()
	});

In this case `authorStore.one()` will return a random object from the store, and that object will be embedded in the `author` property of the `article`.


## Custom data and API endpoints

In some cases you might need additional API points that can handle some specific task. For instance you might have `/login` endpoint where users can login. This action will still use the `users` store, but will have to behave differently than the default REST actions. Also, for development and testing you need a user with the known credentials, so you can actually login to the app. Here is how you can solve this problem with APItizer:

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
	}, userStore;

	apitizer.addSchema('user', schema);
	userStore = apitizer.schemaStore('user', 0, {
		id : apitizer.types.autoincrement()
	})

Here we have defined the schema, and created an empty store, now we can add some custom data:

	userStore.add({
		username : 'retro',
		password : '1337'
	});

This will create a user with known credentials. Now all we need to do is create the `/login` endpoint:

	apitizer.fixture('POST /login', function(params){
		var users = userStore.db(params) // Search the data in the store's database
		if(users.count() === 0){
			throw {errors: ['Wrong credentials'], status: 401}
		} else {
			return users.first();
		}
	});

_APItizer uses the excellent [TaffyDB](http://www.taffydb.com) library to store the data, so you can use it's [fancy querying possibilities](http://www.taffydb.com/workingwithdata) to get the data._

Now you can emulate the login process by POSTing to the `/login` endpoint:

	$.post('/login', {
		username : 'retro',
		password : 1338
	}).then(function(user){
		alert('You logged in!')
	}, function(error){
		alert('Wrong credentials!')
	});

## Response delay

To simulate the real requests, responses will be returned with a delay. Default delay is 200 milliseconds, but you can easiliy change it:

	apitizer.fixture.delay(300) // delay is now 300 milliseconds

You can also give it a range of values, which will make the delay random:

	apitizer.fixture.delay(200, 500) // delay will be between 200 and 500 milliseconds

Random delay is a good way to simulate the real network conditions, and to get a feeling of responsivnes of your app.

--

You can find more docs in the [wiki](https://github.com/retro/apitizer/wiki)
