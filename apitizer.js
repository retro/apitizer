define([
	'tv4',
	'./lib/types',
	'lodash/collections/forEach',
	'./lib/fixtures',
	'./lib/store',
	'./lib/api',
], function(tv4, types, _forEach, fixture, Store, API){

	types.formats = types.formats || {};

	_forEach(types.formats, function(format, name){
		tv4.addFormat('name', function(val){
			if(format.validate(val)){
				return null;
			}
			return 'failed validation by the ' + name + ' format';
		});
	});

	return {
		addSchema : function(name, schema){
			Store.addSchema(name, schema);
		},
		getSchema : function(name){
			return Store.getSchema(name);
		},
		dropSchemas : function(){
			Store.dropSchemas();
		},
		validateWithSchema : function(name, data){
			return Store.validateWithSchema(name, data);
		},
		generateFromSchema : function(name, overrides){
			return (new Store(name, 0, overrides, this.API)).generate();
		},
		schemaStore : function(name, count, overrides, api){
			return new Store(name, count, overrides, api || this.API);
		},
		addFormat : function(name, format){
			Store.addFormat(name, format);
		},
		types : types,
		fixture : fixture,
		API : API
	};
})