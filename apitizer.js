requirejs([
	'can/construct',
	'can/util/fixture',
	'tv4',
	'./lib/types',
	'lodash'
], function(Construct, fixture, tv4, types, _){


	var schemaGenerators = {
		"array"   : function(schema){},
		"boolean" : function(schema){},
		"integer" : function(schema){},
		"number"  : function(schema){},
		"null"    : function(schema){},
		"object"  : function(schema){},
		"string"  : function(schema){}
	}




	var makeSchemaGenerators = function(name, schema){
		var generator
	}

	var generators = {};


	var apitizer = {
		addSchema : function(){

		},

	};




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