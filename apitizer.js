define([
	'can/construct',
	'tv4',
	'./lib/types',
	'lodash',
	'./lib/fixtures',
	'./lib/generator',
], function(Construct, tv4, types, _, fixture, Generator){

	types.formats = types.formats || {};

	_.forEach(types.formats, function(format, name){
		tv4.addFormat('name', function(val){
			if(format.validate(val)){
				return null;
			}
			return 'failed validation by the ' + name + ' format';
		});
	});

	return {
		addSchema : function(name, schema){
			Generator.addSchema(name, schema);
		},
		getSchema : function(name){
			return Generator.getSchema(name);
		},
		dropSchemas : function(){
			Generator.dropSchemas();
		},
		validateWithSchema : function(name, data){
			return Generator.validateWithSchema(name, data);
		},
		generateFromSchema : function(name, overrides){
			return (new Generator(name, 0, overrides)).generate();
		},
		schemaStore : function(name, storeCount, overrides){
			return new Generator(name, storeCount, overrides);
		},
		addFormat : function(name, format){
			Generator.addFormat(name, format);
		},
		types : types,
		fixture : fixture
	};
})