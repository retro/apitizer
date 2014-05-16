define(['can/construct', './types', 'lodash', 'taffy', 'tv4'], function(Construct, types, _, Taffy, tv4){

	var currentSchema = "";

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
			var format;
			if(schema.pattern){
				return types.randexp(schema);
			} else if(schema.format){
				format = types.formats[schema.format];
				return _.isFunction(format) ? format(schema) : format;
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

	var generateFromSchema = function(schema, rawSchema, overrides){
		var result,
			generator = function(result){
				var attrs = [];
				return _.reduce(result, function merger(result, type, key){
					var val, path;

					attrs.push(key);
					path = attrs.join('.');

					if(overrides[path]){
						type = _.isFunction(overrides[path]) ? { generate : overrides[path]} : overrides[path];
					}

					val = _.isFunction(type.generate) ? type.generate() : type;
					val = _.isPlainObject(val) ?  _.reduce(val, merger, {}) : val;

					result[key] = val;
					attrs.pop();

					return result;
				}, {});
			}

		if(rawSchema.type === "object" || typeof rawSchema.type === 'undefined'){
			return generator(schema.generate());
		} else if(rawSchema.type === "array"){
			return _.map(schema.generate(), generator);
		} else {
			return schema.generate();
		}
	}

	var prepareOrder = function(){}

	var getRecordset = function(store, params){
		var items, order, limit, offset;

		order  = params.order;
		limit  = params.limit;
		offset = params.offset;

		delete params.order;
		delete params.limit;
		delete params.offset;

		items = store(params);

		if(order){
			items = items.order(prepareOrder(order));
		}
		if(limit){
			items = items.limit(parseInt(limit, 10));
		}
		if(offset){
			items = items.start(offset);
		}

		return items;
	}

	var API = {
		findOne : function(params){
			var items = getRecordset(this.store, params);
			if(items.count()){
				return items.first();
			} else {
				throw "MissingRecord";
			}
		},
		findAll : function(params){
			var results = {},
				items = getRecordset(this.store, params);

			results.data = items.get();
			results.count = items.count();

			if(params.limit){
				result.limit = params.limit;
			}

			if(params.offset){
				result.offset = params.offset;
			}

			return results;
		},
		create : function(params, data){
			var item = _.merge(this.generate(), data),
				validation = this.validate(item);

			if(validation.valid){
				this.store.insert(item);
			} else {
				throw validation.errors;
			}
			return item;
		},
		update : function(params, data){
			var items = getRecordset(this.store, params),
				item, validation;

			if(items.count() === 0){
				throw "MissingRecord";
			}

			item = _.merge(items.first(), data);
			validation = this.validate(item);

			if(validation.valid){
				items.update(item);
				return item;
			} else {
				throw validation.errors;
			}

		},
		destroy : function(params){
			var items = getRecordset(this.store, params);
			if(items.count()){
				items.remove();
				return {};
			} else {
				throw "MissingRecord";
			}
		}
	}

	var Generator = Construct.extend({
		rawSchemas : {},
		schemas : {},
		addSchema : function(name, schema){
			currentSchema = name;
			this.rawSchemas[name] = schema;
			this.schemas[name] = determineGenerator(schema)(schema);
			currentSchema = "";
		},
		getSchema : function(name){
			return this.rawSchemas[name];
		},
		dropSchemas : function(){
			this.rawSchemas = {};
			this.schemas = {};
		}
	},{
		init : function(name, storeCount, overrides){
			var self = this;

			this._schema = this.constructor.schemas[name];
			this._rawSchema = this.constructor.rawSchemas[name];
			this._schemaName = name;
			this._overrides = overrides || {};

			if(!this._rawSchema){
				throw new Error(_.template('Apitizer: Missing schema named "<%= _schemaName %>"', this));
			}
			
			this.store = Taffy();
			this.fillStore(storeCount || 0);

			_.each(API, function(fn, name){
				self[name] = _.bind(fn, self);
			});

		},
		generate : function(overrides){
			return generateFromSchema(this._schema, this._rawSchema, overrides || this._overrides);
		},
		fillStore : function(count){
			for(var i = this.store().count(); i < count; i++){
				this.store.insert(this.generate());
			}
			this.makeRandomizer();
		},
		addToStore : function(overrides){
			this.store.insert(this.generate(overrides));
			this.makeRandomizer();
		},
		makeRandomizer : function(){
			this.randomizer = types.integer({
				minimum : 0,
				maximum : this.store().count(),
				exclusiveMaximum : true
			});
		},
		one : function(){
			var self = this;

			return function(){
				return self.store().get()[self.randomizer.generate()];
			}
		},
		many : function(min, max){
			var self = this,
				randLength;

			min = min || 0;
			max = max || this.store.length;

			randLength = types.integer({
				minimum : min,
				maximum : max,
				exclusiveMaximum : true
			});

			return function(){
				var length = randLength.generate(),
					result = [],
					ids = [],
					store = self.store().get(),
					current;

				while(result.length < length){
					current = self.randomizer.generate();
					if(ids.indexOf(current) === -1){
						result.push(store[current]);
					}
				}

				return result;
			}
		},
		validate : function(data){
			return tv4.validateMultiple(data, this._schemaName);
		}
		
	})

	return Generator;
})