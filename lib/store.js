define([
'./types',
'taffy',
'tv4',
'lodash/objects/clone',
'lodash/objects/isArray',
'lodash/objects/isFunction',
'lodash/objects/isPlainObject',
'lodash/collections/map',
'lodash/objects/merge',
'lodash/collections/reduce',
'lodash/objects/assign',
'lodash/functions/bindAll'
], function(types, Taffy, tv4, _clone, _isArray, _isFunction, _isPlainObject, _map, _merge, _reduce, _assign, _bindAll){

	var currentSchema = "";

	var determineGenerator = function(schema){
		if(schema['$ref']){
			return refSchema(_clone(schema));
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
					var refSchema = getRef(Store.rawSchemas[schemaName], ref.split('/'));
					return determineGenerator(_merge(schema, refSchema))(_merge(schema, refSchema)).generate();
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
				generators = _map(items, function(item){
					return determineGenerator(item)(item);
				});
			if(_isArray(items)){
				return {
					generate : function(){
						return _map(generators, function(generator){
							return generator.generate();
						});
					},
					validate : function(val){
						return _reduce(generators, function(valid, generator){
							return generator.validate(val) && valid;
						}, true);
					}
				}
			} else {
				return types.array(_merge({
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
			var generators = _reduce(schema.properties, function(generators, prop, propName){
				generators[propName] = determineGenerator(prop)(prop);
				return generators;
			}, {});
			return {
				generate : function(){
					return generators;
				},
				validate : function(val){
					return _reduce(generators, function(valid, generator, prop){
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
				return _isFunction(format) ? format(schema) : format;
			}
			return types.string(schema);
		},
		"enum"   : function(schema){
			var values = schema.enum,
				type   = schema.type;
			if(type){
				values = _reduce(values, function(acc, current){
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
			var clonedSchema = _clone(schema),
				generators, indexGenerator;

			delete clonedSchema.anyOf;

			generators = _map(schema.anyOf, function(subschema){
				var combinedSchema = _merge({}, clonedSchema, subschema)
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
				generate : determineGenerator(_merge.apply(null, schema.allOf))(schema).generate
			};
		},
		oneOf : function(schema){
			var clonedSchema = _clone(schema),
				generators, indexGenerator;

			delete clonedSchema.oneOf;

			generators = _map(schema.oneOf, function(subschema){
				var combinedSchema = _merge({}, clonedSchema, subschema)
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
				return _reduce(result, function merger(result, type, key){
					var val, path;

					attrs.push(key);
					path = attrs.join('.');

					if(overrides[path]){
						type = _isFunction(overrides[path]) ? { generate : overrides[path]} : overrides[path];
					}

					val = _isFunction(type.generate) ? type.generate() : type;
					val = _isPlainObject(val) ?  _reduce(val, merger, {}) : val;

					result[key] = val;
					attrs.pop();

					return result;
				}, {});
			}

		if(rawSchema.type === "object" || typeof rawSchema.type === 'undefined'){
			return generator(schema.generate());
		} else if(rawSchema.type === "array"){
			return _map(schema.generate(), generator);
		} else {
			return schema.generate();
		}
	}

	var Store = function(name, storeCount, overrides, API){

		if(typeof this.constructor === 'undefined'){
			return new Store(name, storeCount, overrides);
		}

		this._schema = this.constructor.schemas[name];
		this._rawSchema = this.constructor.rawSchemas[name];
		this._schemaName = name;
		this._overrides = overrides || {};

		if(!this._rawSchema){
			throw new Error('Apitizer: Missing schema named "' + this._schemaName + '"');
		}

		this.API = _bindAll(new API(this));
		
		this.db = Taffy();
		this.fillStore(storeCount || 0);
	}

	_assign(Store, {
		rawSchemas : {},
		schemas : {},
		addSchema : function(name, schema){
			// TODO: remove currentSchema manipulation when adding schema
			currentSchema = name;
			this.rawSchemas[name] = schema;
			this.schemas[name] = determineGenerator(schema)(schema);
			tv4.addSchema(name, schema);
			currentSchema = "";
		},
		getSchema : function(name){
			return this.rawSchemas[name];
		},
		dropSchemas : function(){
			this.rawSchemas = {};
			this.schemas = {};
			tv4.dropSchemas();
		},
		validateWithSchema : function(name, data){
			return tv4.validateMultiple(data, name);
		},
		addFormat : function(name, format){
			types.formats[name] = format;
			tv4.addFormat(name, function(val){
				if(format.validate(val)){
					return null;
				}
				return 'failed validation by the ' + name + ' format';
			})
		}
	});

	_assign(Store.prototype, {
		generate : function(overrides){
			var combinedOverrides = _assign({}, this._overrides, overrides);
			return generateFromSchema(this._schema, this._rawSchema, combinedOverrides);
		},
		fillStore : function(count){
			for(var i = this.db().count(); i < count; i++){
				this.db.insert(this.generate());
			}
			this.makeRandomizer();
		},
		add : function(overrides){
			var data = this.generate(overrides);

			this.db.insert(data);
			this.makeRandomizer();

			return data;
		},
		makeRandomizer : function(){
			var count = this.db().count();

			if(count === 0){
				this.randomizer = {
					generate : function(){
						return 0;
					}
				}
			} else {
				this.randomizer = types.integer({
					minimum : 0,
					maximum : this.db().count(),
					exclusiveMaximum : true
				});
			}
		},
		one : function(){
			var self = this;

			return function(){
				return self.db().get()[self.randomizer.generate()];
			}
		},
		many : function(min, max){
			var self = this,
				storeCount = this.db().count(),
				randLength;

			min = min || 0;
			max = max || storeCount;

			randLength = types.integer({
				minimum : min,
				maximum : max
			});

			return function(){
				var length = randLength.generate(),
					result = [],
					store = self.db().get(),
					start =  self.randomizer.generate();

				if(start + length >= storeCount){
					start = Math.max(start + (storeCount - start - length) - 1, 0);
				}

				for(var i = 0; i < length; i++){
					result.push(store[start + i]);
				}

				return result;
			}
		},
		validate : function(data){
			return tv4.validateMultiple(data, this._schemaName);
		}
		
	});

	return Store;
})