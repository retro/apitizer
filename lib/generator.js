define(['can/construct', './types', 'lodash'], function(Construct, types, _){

	var currentSchema = ""

	var determineGenerator = function(schema){
		if(schema['$ref']){
			return refSchema(_.clone(schema));
		} else if(schema.anyOf){
			return combinatorGenerators.anyOf;
		} else if(schema.allOf){
			return combinatorGenerators.allOf;
		} else if(schema.oneOf){
			return combinatorGenerators.oneOf;
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

	var refSchema = function(schema){
		var refPath = schema["$ref"].split('#'),
			ref = refPath.pop().replace(/^\//, "").replace(/\/$/, ""),
			schemaName = refPath.length > 0 && refPath[0] !== "" ? refPath.shift() : currentSchema;
		
		delete schema["$ref"];

		return function(s){
			return {
				generate : function(){
					var refSchema = getRef(Generator.rawSchemas[schemaName], ref.split('/'));
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

	var schemaGenerators = {
		"array"   : function(schema){
			var items = schema.items,
				generators = _.map(items, function(item){
					return determineGenerator(item)(item);
				});
			if(_.isArray(items)){
				return {
					generate : function(){
						return _.map(generators, function(generator){
							return generator.generate();
						});
					},
					validate : function(val){
						return _.reduce(generators, function(valid, generator){
							return generator.validate(val) && valid;
						}, true);
					}
				}
			} else {
				return types.array(_.merge({
					typeDef : determineGenerator(schema.items)(schema.items)
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
			var generators = _.reduce(schema.properties, function(generators, prop, propName){
				generators[propName] = determineGenerator(prop)(prop);
				return generators;
			}, {});
			return {
				generate : function(){
					return generators;
				},
				validate : function(val){
					return _.reduce(generators, function(valid, generator, prop){
						return valid && generator.validate(val[prop]);
					}, true);
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
				generators, indexGenerator;

			delete clonedSchema.anyOf;

			generators = _.map(schema.anyOf, function(subschema){
				var combinedSchema = _.merge({}, clonedSchema, subschema)
				return determineGenerator(combinedSchema)(combinedSchema);
			});

			indexGenerator = types.integer({
				minium: 0, 
				maximum: generators.length, 
				exclusiveMaximum: true
			});

			return {
				generate : function(){
					var index = indexGenerator.generate();
					return generators[index].generate();
				}
			}
		},
		allOf : function(schema){
			return {
				generate : determineGenerator(_.merge.apply(_, schema.allOf))(schema).generate
			};
		},
		oneOf : function(schema){
			var clonedSchema = _.clone(schema),
				generators, indexGenerator;

			delete clonedSchema.oneOf;

			generators = _.map(schema.oneOf, function(subschema){
				var combinedSchema = _.merge({}, clonedSchema, subschema)
				return determineGenerator(combinedSchema)(combinedSchema);
			});

			indexGenerator = types.integer({
				minium: 0, 
				maximum: generators.length, 
				exclusiveMaximum: true
			});

			return {
				generate : function(){
					var index = indexGenerator.generate();
					return generators[index].generate();
				}
			}
		}
	}

	var Generator = Construct.extend({
		rawSchemas : {},
		schemas : {},
		addSchema : function(name, schema){
			this.rawSchemas[name] = schema;
			this.schemas[name] = determineGenerator(schema)(schema).generate();
		}
	},{
		init : function(name){
			this.schema = this.constructor.schemas[name];
			this.store = [];
		},
		generate : function(){
			var schema = this.schema;
			return _.merge({}, schema, function merger(current, generator){
				var val = _.isFunction(generator.generate) ? generator.generate() : generate;
				return _.isPlainObject(val) ?  _.merge({}, val, merger) : val;
			})
		}
	})

	return Generator;
})