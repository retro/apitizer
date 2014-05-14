define([
	'can/construct',
	'tv4',
	'./lib/types',
	'lodash',
	'./lib/fixtures',
	'./lib/generator',
], function(Construct, tv4, types, _, fixtures, Generator){

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
			tv4.addSchema(name, schema);
			Generator.addSchema(name, schema);
		},
		validateWithSchema : function(name, data){
			return tv4.validateMultiple(data, name);
		},
		generateFromSchema : function(name){
			return (new Generator(name)).generate();
		},
		addFormat : function(name, format){
			types.formats[name] = format;
			tv4.addFormat('name', function(val){
				if(format.validate(val)){
					return null;
				}
				return 'failed validation by the ' + name + ' format';
			})
		},
		fixtures : fixtures
	};
})