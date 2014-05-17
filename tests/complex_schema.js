define(['apitizer', 'lodash'], function(apitizer, _) {
	return function() {

		module('apitizer/complex_schema', {
			teardown : function(){
				apitizer.dropSchemas();
			}
		});

		test('Ref schema', function() {
			var schema = {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				definitions: {
					address: {
						type: "object",
						properties: {
							street_address: {
								"type": "string"
							},
							city: {
								"type": "string"
							},
							state: {
								"type": "string"
							},
							phoneNumbers: {
								"type": "array",
								items: {
									type: "integer",
									minimum: 1000000,
									maximum: 9999999
								}
							},
							country: {
								oneOf: [{
									type: "object",
									properties: {
										postal: {
											type: "integer",
											minimum: 100,
											maximum: 999
										},
										name: {
											type: "string"
										}
									}
								}, {
									type: "string"
								}]
							}
						},
						required: ["street_address", "city", "state"]
					}
				},
				properties: {
					billing_address: {
						"$ref": "#/definitions/address"
					},
					shipping_address: {
						allOf: [{
							$ref: "#/definitions/address"
						}, {
							properties: {
								type: {
									enum: ["residential", "business"]
								}
							},
							required: ["type"]
						}]
					}
				}
			}, generated, result;

			apitizer.addSchema('address', schema);

			generated = apitizer.generateFromSchema('address');
			result = apitizer.validateWithSchema('address', generated);

			ok(result.valid, 'Generating data from the complex schema returns correct data');
			equal(result.missing, 0, '0 schemas are missing');


		});

		test("Array of references", function(){
			var userSchema = {
					type : "object",
					properties : {
						username : {
							type : "string"
						}
					}
				}, groupSchema = {
					type : "object",
					properties : {
						name : {
							type : "string"
						},
						users : {
							type : "array",
							items : {
								$ref : 'user'
							}
						}
					}
				}, userStore, groupStore, result;

			apitizer.addSchema('user', userSchema);
			apitizer.addSchema('group', groupSchema);

			userStore = apitizer.schemaStore('user', 3, {
				username : (function(){
					var counter = 1;
					return function(){
						return "User " + (counter++);
					}
				})()
			});

			groupSchema = apitizer.schemaStore('group', 0, {
				users : userStore.many(3, 3)
			});

			result = groupSchema.generate();

			deepEqual(['User 1', 'User 2', 'User 3'], _.map(result.users, function(user){
				return user.username;
			}).sort(), "Array of references is correct");

		})

	};
});