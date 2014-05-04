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
		"boolean" : function(name, schema){},
		"integer" : function(name, schema){
			return types.integer(schema).generate;
		},
		"number"  : function(name, schema){},
		"null"    : function(name, schema){},
		"object"  : function(name, schema){
			return _.reduce(schema.properties, function(generators, prop, propName){
				generators[propName] = schemaGenerators[prop.type](propName, prop);
				return generators;
			}, {})
		},
		"string"  : function(name, schema){
			return types.string(schema).generate;
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
			schemas[name] = schemaGenerators[schema.type || 'object'](name, schema);
		},
		generateFromSchema : function(name){
			return _.merge({}, schemas[name], function merger(current, generator){
				if(_.isFunction(generator)){
					return generator();
				}
				return _.merge({}, generator, merger);
			})
		}
	};

	apitizer.addSchema('address', {
  "type": "object",
  "properties": {
    "street_address": { "type": "string" },
    "city":           { "type": "string" },
    "state":          { "type": "string" },
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