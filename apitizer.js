requirejs([
	'can/construct',
	'can/util/fixture',
	'tv4',
	'./lib/types',
	'lodash'
], function(Construct, fixture, tv4, types, _){

	var currentPath = [];

	var schemaGenerators = {
		"array"   : function(schema){
			var items = schema.items,
				generators = _.map(items, function(item){
					 determineGenerator(item)(item).generate
				});
			if(_.isArray(items)){
				return {
					generate : function(){
						return _.map(generators, function(generator){
							return generator();
						});
					}
				}
			} else {
				return types.array(_.merge({
					generator : determineGenerator(schema.items)(schema.items).generate
				}, schema));
			}
		},
		"boolean" : function(schema){
			return types.boolean(schema);
		},
		"integer" : function(schema){
			return types.integer(schema);
		},
		"number"  : function(schema){
			return types.number(schema);
		},
		"null"    : function(schema){
			return types.null(schema);
		},
		"object"  : function(schema){
			return {
				generate : function(){
					return _.reduce(schema.properties, function(generators, prop, propName){
						generators[propName] = determineGenerator(prop)(prop);
						return generators;
					}, {});
				}
			}
		},
		"string"  : function(schema){
			if(schema.pattern){
				return types.randexp(schema);
			} else if(schema.format){
				return types[schema.format](schema);
			}
			return types.string(schema);
		},
		"enum"   : function(schema){
			var values = schema.enum,
				type   = schema.type;
			if(type){
				values = _.reduce(values, function(acc, current){
					(typeof current === type) && acc.push(current);
					return acc;
				}, []);
			}
			return {
				generate : function(){
					var rand = types.integer({minimum: 0, maximum: values.length, exclusiveMaximum: true});
					return values[rand.generate()];
				}
			}
		}
	}

	var combinatorGenerators = {
		anyOf : function(schema){
			var clonedSchema = _.clone(schema),
				generators;

			delete clonedSchema.anyOf;

			generators = _.map(schema.anyOf, function(subschema){
				return determineGenerator(_.extend({}, clonedSchema, subschema))(schema);
			});

			return {
				generate : function(){
					var i = types.integer({
								minium: 0, 
								maximum: generators.length, 
								exclusiveMaximum: true
							}).generate();

					return generators[i].generate();
				}
			}
		},
		allOf : function(schema){
			return {
				generate : determineGenerator(_.merge.apply(_, schema.allOf))(schema).generate
			};
		},
		oneOf : function(schema){
			var generator = combinatorGenerators.anyOf()
			return {
				generate : function(){}
			}
		},
		not : function(schema){
			return {
				generate : function(){}
			}
		}
	}

	var refSchema = function(schema){
		var refPath = schema["$ref"].split('#'),
			ref = refPath.pop().replace(/^\//, "").replace(/\/$/, ""),
			schemaName = refPath.length > 0 && refPath[0] !== "" ? refPath.shift() : currentSchema;
		
		delete schema["$ref"];

		return function(s){
			return {
				generate : function(){
					var refSchema = getRef(rawSchemas[schemaName], ref.split('/'));
					return determineGenerator(_.merge(schema, refSchema))(_.merge(schema, refSchema)).generate();
				}
			}
		}
	}

	var getRef = function(schema, r){
		if(r.length){
			return getRef(schema[r.shift()], r);
		}
		return schema;
	}

	var determineGenerator = function(schema){
		if(schema['$ref']){
			return refSchema(_.clone(schema));
		} else if(schema.anyOf){
			return combinatorGenerators.anyOf;
		} else if(schema.allOf){
			return combinatorGenerators.allOf;
		} else if(schema.oneOf){
			return combinatorGenerators.oneOf;
		} else if(schema.not){
			return combinatorGenerators.not
		} else if(schema.enum){
			return schemaGenerators.enum;
		} else if(schema.type){
			return schemaGenerators[schema.type];
		} else if(schema.format){
			return schemaGenerators.string;
		} else if(schema.properties){
			return schemaGenerators.object;
		} else if(schema.items){
			return schemaGenerators.array;
		}
		return function(){
			return {
				generate : function(){
					return {};
				},
				validate : function(){
					return true;
				}
			}
		}
	}

	var schemas = {};
	var rawSchemas = {};
	var generators = {};
	var currentSchema = "";

	var apitizer = {
		addSchema : function(name, schema){
			currentSchema = name;
			schemas[name] = determineGenerator(schema)(schema).generate();
			tv4.addSchema(name, schema);
			rawSchemas[name] = schema;
			currentSchema = "";
		},
		generateFromSchema : function(name){
			return _.merge({}, schemas[name], function merger(current, generator){
				var val = _.isFunction(generator.generate) ? generator.generate() : generate;
				return _.isPlainObject(val) ?  _.merge({}, val, merger) : val;
			})
		},
		validateWithSchema : function(name, data){
			return tv4.validateMultiple(data, name);
		},
		addFormat : function(){

		}
	};

apitizer.addSchema('address', {
  "$schema": "http://json-schema.org/draft-04/schema#",

  "definitions": {
    "address": {
      "type": "object",
      "properties": {
        "street_address": { "type": "string" },
        "city":           { "type": "string" },
        "state":          { "type": "string" },
        "phoneNumbers" : {"type": "array", items: {
        	type: "integer",
        	minimum : 1000000,
        	maximum : 9999999
        }}
      },
      "required": ["street_address", "city", "state"]
    }
  },

  "type": "object",

  "properties": {
    "billing_address": { "$ref": "#/definitions/address" },
    "shipping_address": {
      "allOf": [
        { "$ref": "#/definitions/address" },
        { "properties":
          { "type": { "enum": [ "residential", "business" ] } },
          "required": ["type"]
        }
      ]
    }
  }
})

//console.log(schemas)

console.log(apitizer.validateWithSchema(apitizer.generateFromSchema('address')), apitizer.generateFromSchema('address'))


	window.apitizer = apitizer;


	return apitizer;
})