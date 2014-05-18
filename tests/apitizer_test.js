define(['apitizer'], function(apitizer) {
	return function() {

		var userSchema = {
			type : 'object',
			properties : {
				username : {
					type: 'string'
				},
				password : {
					type : 'string'
				}
			}
		}

		module('apitizer', {
			teardown : function(){
				apitizer.dropSchemas();
			}
		});

		test('Adding and retrieving schema', function() {
			apitizer.addSchema('user', userSchema)
			equal(apitizer.getSchema('user'), userSchema, "Adding and retrieving schemas works")
		});

		test('Validating with schema', function() {
			var result;

			apitizer.addSchema('user', userSchema);

			result = apitizer.validateWithSchema('user', {
				username : 'foo',
				password : 'bar'
			});

			ok(result.valid, "Schema successfuly validated the object");
		});

		test('Droping schemas', function(){
			var schema = {};

			apitizer.addSchema('foo', schema);
			equal(apitizer.getSchema('foo'), schema, "Schema is added");

			apitizer.dropSchemas();

			equal(apitizer.getSchema('foo'), undefined, 'Schemas are dropped');
		});

		test('Generating data based on schema works', function(){
			var generated, result;
			apitizer.addSchema('user', userSchema);

			generated = apitizer.generateFromSchema('user');
			result = apitizer.validateWithSchema('user', generated);

			ok(result.valid, 'Data generated from schema is valid')
		})

		test('Adding a custom format', function(){
			var format = {
					generate : function(){
						return "foo";
					},
					validate : function(val){
						return val === "foo";
					}
				},
				schema = {
					type : "object",
					properties : {
						username : {
							type : "string",
							format : 'foo'
						}
					}
				}, generated, result;

			apitizer.addFormat('foo', format);
			apitizer.addSchema('bar', schema);

			generated = apitizer.generateFromSchema('bar');
			result = apitizer.validateWithSchema('bar', generated);

			deepEqual({username : 'foo'}, generated, 'Correct data is generated');
			ok(result.valid, "Custom format is correctly validated");

			generated = {username : 'qux'};
			result = apitizer.validateWithSchema('bar', generated);

			ok(!result.valid, "Wrong data is not valid");

		})

		test("Store", function(){
			var store, generated, result;

			apitizer.addSchema('user', userSchema);

			store = apitizer.schemaStore('user', 1);
			generated = store.one()();
			result = apitizer.validateWithSchema('user', generated);

			ok(result.valid, "Accessing data from store works");
		});

		test("Passing overrides to store", function(){
			var store, generated, result;

			apitizer.addSchema('user', userSchema);

			store = apitizer.schemaStore('user', 1, {
				username : "foo"
			});
			generated = store.one()();
			result = apitizer.validateWithSchema('user', generated);

			equal('foo', generated.username, 'Overriding generators works');
		})

	};
});