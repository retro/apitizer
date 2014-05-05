requirejs([
	'can/construct',
	'can/util/fixture',
	'tv4',
	'./lib/types',
	'lodash'
], function(Construct, fixture, tv4, types, _){

	var currentPath = [];

	var schemaGenerators = {
		"array"   : function(name, schema){},
		"boolean" : function(name, schema){
			return types.boolean(schema);
		},
		"integer" : function(name, schema){
			return types.integer(schema);
		},
		"number"  : function(name, schema){
			return types.number(schema);
		},
		"null"    : function(name, schema){
			return types.null(schema);
		},
		"object"  : function(name, schema){
			return {
				generate : function(){
					return _.reduce(schema.properties, function(generators, prop, propName){
						generators[propName] = determineGenerator(prop)(propName, prop);
						return generators;
					}, {});
				}
			}
		},
		"string"  : function(name, schema){
			if(schema.pattern){
				return types.randexp(schema);
			} else if(schema.format){
				return types[schema.format](schema);
			}
			return types.string(schema);
		}
	}

	var combinatorGenerators = {
		anyOf : function(name, schema){
			var clonedSchema = _.clone(schema),
				generators;

			delete clonedSchema.anyOf;

			generators = _.map(schema.anyOf, function(subschema){
				return determineGenerator(_.extend({}, clonedSchema, subschema))(name, schema);
			});

			return {
				generate : function(){
					var i = types.integer({
								minium: 0, 
								maximum: generators.length, 
								exclusiveMaximum: true
							}).generate();

					return generators[i]();
				}
			}
		},
		allOf : function(name, schema){
			return {
				generate : determineGenerator(_.merge.apply(_, schema.allOf))(name, schema)
			};
		},
		oneOf : function(name, schema){
			var generator = combinatorGenerators.anyOf()
			return {
				generate : function(){}
			}
		},
		not : function(name, schema){
			return {
				generate : function(){}
			}
		}
	}

	var refSchema = function(ref){
		return {
			generate : function(){}
		}
	}

	var determineGenerator = function(schema){
		if(schema['$ref']){
			return determineGenerator(refSchema(schema['$ref']));
		} else if(schema.anyOf){
			return combinatorGenerators.anyOf;
		} else if(schema.allOf){
			return combinatorGenerators.allOf;
		} else if(schema.oneOf){
			return combinatorGenerators.oneOf;
		} else if(schema.not){
			return combinatorGenerators.not
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

	var withName = function(name, fn){
		currentPath.push(name);
		schemas[currentPath.join('.')] = fn();
		currentPath.pop();
	}

	var schemas = {};

	var makeSchemaGenerators = function(name, schema){
		var generator
	}

	var generators = {};


	var apitizer = {
		addSchema : function(name, schema){
			schemas[name] = determineGenerator(schema)(name, schema).generate();
		},
		generateFromSchema : function(name){
			return _.merge({}, schemas[name], function merger(current, generator){
				var val = generator.generate();
				return _.isPlainObject(val) ?  _.merge({}, val, merger) : val;
			})
		}
	};

	apitizer.addSchema('address', {
  "type": "object",
  "properties": {
    "street_address": { "type": "string" },
    "city":           { "type": "string" },
    "state":          { "type": "string" },
    "uuid" : {"type" : "string", pattern : /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/},
    "foo" : {
    	type : "object",
    	properties : {
    		bar : {type: "integer"}
    	}
    }
  },
  "required": ["street_address", "city", "state"]
})

console.log(schemas)

console.log(apitizer.generateFromSchema('address'))


	/*var Apitizer = Construct.extend({
		init : function(){
			this.schemas = {};
			this.formats = {};
		},
		addSchema : function(name, schema){
			this.schemas[name] = schema;
			if(schema.properties){
				tv4.addSchema(name, schema);
			} else {
				tv4.addSchema(name, {
					title : name + " schema",
					type : 'object',
					properties : schema
				});
			}
		},
		generateFromSchema : function(name){
			var schema = this.schemas[name],
				self   = this;
			return _.reduce(schema, function(res, val, key){

				if(val['$ref']){
					res[key] = self.generateFromSchema(val['$ref']);
				} else {
					res[key] = self.formats[val['format'] || val['type']].generate();
				}

				return res;
			}, {});
		},
		validate : function(schema, data){
			return tv4.validateMultiple(data, schema);
		},
		addFormat : function(name, fn){
			var type = fn();
			tv4.addFormat(name, function(val){
				if(!type.validate(val)){
					return "is not a valid " + name + " with options: " + JSON.stringify(type.opts);
				}
				return null;
			});
			this.formats[name] = type;
		}

	})

	var apitizer = new Apitizer();

	_.each(types, function(fn, name){
		if(name !== 'arrayOf'){
			apitizer.addFormat(name, fn);
		}
	})*/

	window.apitizer = apitizer;


	return apitizer;
})