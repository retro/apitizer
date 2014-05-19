# APItizer

APItizer is a library that allows you to mock APIs for browser applications with JSON schema. JSON schema is usually used to validate responses from APIs, but APItizer adds the ability to generate data from the same structure.

## Why

When developing single page apps, it is beneficial to develop frontend and backend in parallel. To achieve that, you need to mock the API. CanJS implements this elegantly with the `can.fixture` plugin (used by APItizer). `can.fixture` intercepts AJAX calls and returns response defined by the fixtures.

APItizer goes a step further, and instead of manually defining your fixtures they are generated from the JSON schema.

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
