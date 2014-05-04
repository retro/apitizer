define([
	'lodash',
	'./types/string',
	'./types/integer',
	'./types/decimal',
	'./types/date',
	'./types/boolean',
	'./types/composite',
	'./types/number'
], function(
	_,
	string,
	integer,
	decimal,
	date,
	bool,
	composite,
	number
){
	var types = {
		'string' : string,
		'integer' : integer,
		'decimal' : decimal,
		'date' : date,
		'boolean' : bool,
		'composite' : composite,
		'number' : number,
	};

	types.arrayOf = function(type, typeOpts){
		var count   = integer({max : 10}).generate(),
			typeObj = types[type](typeOpts);

		return {
			generate : function(){
				return _.map(Array(count), function(){
					return typeObj.generate();
				});
			},
			validate : function(val){
				var check = _.isArray(val);

				if(!check){
					return false;
				}

				return _.reduce(val, function(acc, v){
					return acc && typeObj.validate(v);
				}, true);
			}
		}
	}

	window.types = types;

	return types;
})